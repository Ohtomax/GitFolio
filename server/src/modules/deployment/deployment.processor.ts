import { randomUUID } from 'node:crypto';
import { ProjectSchema, RepoNameSchema, DeploymentLogCodeSchema } from '@gitfolio/shared';
import { z } from 'zod';
import type { DeploymentProcessor } from '../../queues/deployment.queue.js';
import { createGitHubDeploymentProvider, type PublishedSource } from '../../providers/github-deploy.js';
import { generateStaticSite } from '../../generators/static.generator.js';
import { generateReactProject } from '../../generators/react.generator.js';
import { ServiceError } from '../../utils/service-error.js';
import { asJson } from './deployment.repository.js';
import type { DeploymentWorkerRepository } from './deployment-worker.repository.js';

const sourceSchema = z.object({ owner: z.string().regex(/^[a-zA-Z0-9-]{1,39}$/), repo: RepoNameSchema,
  repositoryId: z.string().regex(/^\d+$/), commitSha: z.string().regex(/^[a-f0-9]{40}$/), repositoryUrl: z.string().url(), format: z.enum(['static', 'react']) });
export function createDeploymentProcessor(repository: DeploymentWorkerRepository,
  tokens: { getAccessToken(userId: string): Promise<string> },
  publisher = (token: string, assertActive: () => Promise<void>) => createGitHubDeploymentProvider(token, undefined, assertActive),
  isStopping = () => false,
): DeploymentProcessor {
  return async (deploymentId) => {
    const token = randomUUID();
    const claimed = await repository.claim(deploymentId, token);
    if (claimed.busy) return { retryAfterMs: 15000 };
    const record = claimed.record;
    if (!record) return;
    let lost = false;
    let buildUrl: string | undefined;
    const heartbeat = setInterval(() => void repository.heartbeat(deploymentId, token).then((valid) => { if (!valid) lost = true; }).catch(() => { lost = true; }), 20000);
    heartbeat.unref();
    const assertActive = async () => {
      if (lost || isStopping()) throw new ServiceError(409, 'DEPLOYMENT_LEASE_LOST', 'Publishing is continuing in another worker.');
      await repository.assertActive(deploymentId, token);
    };
    try {
      await assertActive();
      const project = ProjectSchema.safeParse(record.snapshot);
      if (!project.success || project.data.id !== record.projectId || !record.repositoryName || !['static', 'react'].includes(record.format ?? '')) throw new ServiceError(409, 'INVALID_SNAPSHOT', 'Start a new deployment for this project.');
      const provider = publisher(await tokens.getAccessToken(record.userId), assertActive);
      let source: PublishedSource;
      if (record.source !== null) source = sourceSchema.parse(record.source);
      else {
        await repository.transition(deploymentId, token, 'BUILDING', 'BUILDING');
        const files = record.format === 'react' ? generateReactProject(project.data) : generateStaticSite(project.data);
        await assertActive();
        await repository.transition(deploymentId, token, 'PUSHING', 'PUSHING');
        const context = await provider.prepare(record.user.githubId, record.repositoryName, record.projectId);
        source = await provider.publish(context, deploymentId, files, record.format === 'react' ? 'react' : 'static');
        await assertActive();
        await repository.transition(deploymentId, token, 'DEPLOYING', 'DEPLOYING', { source: asJson(source), commitSha: source.commitSha });
      }
      const progress = await provider.check(source);
      buildUrl = progress.buildUrl;
      await assertActive();
      if (progress.status === 'failed') throw new ServiceError(409, 'BUILD_FAILED', 'The GitHub build failed.');
      if (progress.status === 'live' && progress.pagesUrl) {
        await repository.transition(deploymentId, token, 'LIVE', 'LIVE', { pagesUrl: progress.pagesUrl, ...(progress.buildUrl ? { buildUrl: progress.buildUrl } : {}) });
        return;
      }
      if (progress.buildUrl) await repository.transition(deploymentId, token, 'DEPLOYING', 'DEPLOYING', { buildUrl: progress.buildUrl });
      await repository.release(deploymentId, token);
      return { retryAfterMs: 5000 };
    } catch (error) {
      if (error instanceof ServiceError && error.code === 'DEPLOYMENT_LEASE_LOST') return { retryAfterMs: 15000 };
      const parsed = DeploymentLogCodeSchema.safeParse(error instanceof ServiceError ? error.code : 'DEPLOYMENT_FAILED');
      const code = parsed.success ? parsed.data : 'DEPLOYMENT_FAILED';
      // Do not copy raw errors/provider bodies into either PostgreSQL history or Redis failure reasons.
      await repository.transition(deploymentId, token, 'FAILED', code, { errorCode: code, ...(buildUrl ? { buildUrl } : {}) }).catch(() => {});
      throw new Error('Deployment could not finish');
    } finally { clearInterval(heartbeat); }
  };
}
