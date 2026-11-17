import type { Logger } from 'pino';
import type { Environment } from '../config/env.schema.js';
import { createDatabase } from '../config/database.js';
import { getGitHubOAuthConfiguration } from '../config/github-oauth.js';
import { createDeploymentQueue, registerDeploymentWorker, type DeploymentQueue } from '../queues/deployment.queue.js';
import { createDeploymentWorkerRepository } from '../modules/deployment/deployment-worker.repository.js';
import { createDeploymentProcessor } from '../modules/deployment/deployment.processor.js';
import { createAuthRepository } from '../modules/auth/auth.repository.js';
import { createGitHubTokenService } from '../modules/auth/github-token.service.js';
import { createGitHubProvider } from '../providers/github.js';
import { createEncryptionService } from '../utils/encryption.js';
import type { Worker } from 'bullmq';

export async function startDeploymentWorker(environment: Environment, logger: Logger) {
  const oauth = getGitHubOAuthConfiguration(environment);
  if (!oauth || !environment.ENCRYPTION_KEY) return null;
  const database = createDatabase(environment);
  let queue: DeploymentQueue | undefined;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let reconciling = false;
  let stopping = false;
  let closePromise: Promise<void> | undefined;
  const close = (force = false) => closePromise ??= (async () => {
    stopping = true; if (timer) clearInterval(timer);
    try { await worker?.close(force); }
    finally { try { await queue?.close(); } finally { await database.$disconnect(); } }
  })();
  try {
    await database.$connect();
    const repository = createDeploymentWorkerRepository(database);
    const tokens = createGitHubTokenService(createAuthRepository(database), createGitHubProvider(oauth), createEncryptionService(environment.ENCRYPTION_KEY));
    queue = createDeploymentQueue(environment.REDIS_URL, logger);
    worker = registerDeploymentWorker(environment.REDIS_URL, logger, createDeploymentProcessor(repository, tokens, undefined, () => stopping));
    let connectionTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([Promise.all([worker.waitUntilReady(), queue.queue.waitUntilReady()]), new Promise<never>((_resolve, reject) => {
        connectionTimeout = setTimeout(() => reject(new Error('Worker connection unavailable')), 10000); connectionTimeout.unref();
      })]);
    } finally { if (connectionTimeout) clearTimeout(connectionTimeout); }
    const reconcile = async () => {
      if (reconciling || stopping || !queue) return;
      reconciling = true;
      try {
        const records = await repository.recoverable();
        await Promise.allSettled(records.map((record) => queue!.enqueue(record.id)));
      } catch { logger.warn('Pending deployment recovery is unavailable'); }
      finally { reconciling = false; }
    };
    await reconcile();
    timer = setInterval(() => void reconcile(), 15000); timer.unref();
    logger.info('GitFolio deployment worker is ready');
    return { close };
  } catch (error) { await close(true); throw error; }
}
