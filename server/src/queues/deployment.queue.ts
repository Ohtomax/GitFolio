import { DelayedError, Queue, UnrecoverableError, Worker, type ConnectionOptions } from 'bullmq';
import { z } from 'zod';
import type { Logger } from 'pino';

export const DeploymentJobSchema = z.object({ deploymentId: z.string().uuid() }).strict();
export const DEPLOYMENT_QUEUE = 'deployments';
export function deploymentConnection(address: string, worker: boolean): ConnectionOptions {
  const url = new URL(address);
  if (!['redis:', 'rediss:'].includes(url.protocol) || url.search || url.hash || !/^\/(\d+)?$/.test(url.pathname || '/')) throw new Error('Invalid queue connection');
  const database = Number(url.pathname.slice(1) || 0);
  if (!Number.isSafeInteger(database) || database < 0) throw new Error('Invalid queue database');
  return { host: url.hostname.replace(/^\[|\]$/g, ''), port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: database, ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    connectTimeout: 5000, maxRetriesPerRequest: worker ? null : 1,
    enableOfflineQueue: worker, retryStrategy: worker ? (attempt) => Math.min(attempt * 250, 3000) : () => null };
}
export function createDeploymentQueue(address: string, logger: Logger, prefix = 'gitfolio') {
  const queue = new Queue<{ deploymentId: string }>(DEPLOYMENT_QUEUE, {
    connection: deploymentConnection(address, false), prefix,
    defaultJobOptions: { attempts: 1, removeOnComplete: { age: 86400, count: 1000 }, removeOnFail: { age: 604800, count: 1000 } },
  });
  queue.on('error', () => logger.warn('Deployment queue connection is unavailable'));
  return {
    queue,
    async enqueue(deploymentId: string) {
      const data = DeploymentJobSchema.parse({ deploymentId });
      const existing = await queue.getJob(deploymentId);
      if (existing) {
        const state = await existing.getState();
        if (state === 'failed') { await existing.retry(); return; }
        if (state !== 'completed') return;
        await existing.remove();
      }
      await queue.add('publish', data, { jobId: deploymentId });
    },
    close: () => queue.close(),
  };
}
export type DeploymentQueue = ReturnType<typeof createDeploymentQueue>;
export type DeploymentProcessor = (deploymentId: string) => Promise<void | { retryAfterMs: number }>;
export function registerDeploymentWorker(address: string, logger: Logger, processor: DeploymentProcessor, prefix = 'gitfolio') {
  const worker = new Worker(DEPLOYMENT_QUEUE, async (job, token) => {
    const parsed = DeploymentJobSchema.safeParse(job.data);
    if (job.name !== 'publish' || !parsed.success || job.id !== parsed.data.deploymentId) throw new UnrecoverableError('Invalid deployment job');
    const result = await processor(parsed.data.deploymentId);
    if (result) {
      if (!Number.isFinite(result.retryAfterMs) || result.retryAfterMs < 1000 || result.retryAfterMs > 60000) throw new UnrecoverableError('Invalid deployment delay');
      await job.moveToDelayed(Date.now() + result.retryAfterMs, token);
      throw new DelayedError();
    }
  }, { connection: deploymentConnection(address, true), prefix, concurrency: 2, lockDuration: 60000,
    maxStalledCount: 2, autorun: true });
  worker.on('error', () => logger.warn('Deployment worker connection is unavailable'));
  worker.on('failed', (job) => logger.warn({ deploymentId: job?.id }, 'Deployment job failed'));
  return worker;
}
