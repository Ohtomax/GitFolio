import { DEPLOYMENT_MESSAGES, DeploymentLogCodeSchema, DeploymentSchema, type DeploymentQuery, type StartDeploymentInput } from '@gitfolio/shared';
import { z } from 'zod';
import type { DeploymentRepository, StoredDeployment } from './deployment.repository.js';
import type { DeploymentQueue } from '../../queues/deployment.queue.js';
import { ServiceError } from '../../utils/service-error.js';

const storedLog = z.object({ at: z.string().datetime(), code: DeploymentLogCodeSchema });
export function deploymentDto(stored: StoredDeployment) {
  const source = z.object({ repositoryUrl: z.string(), repo: z.string(), format: z.enum(['static', 'react']) }).safeParse(stored.source);
  const entries = Array.isArray(stored.logs) ? stored.logs.slice(-30) : [];
  const logs = entries.flatMap((entry) => { const parsed = storedLog.safeParse(entry); return parsed.success ? [{ ...parsed.data, message: DEPLOYMENT_MESSAGES[parsed.data.code] }] : []; });
  const error = DeploymentLogCodeSchema.safeParse(stored.errorCode);
  return DeploymentSchema.parse({ ...stored, format: source.success ? source.data.format : stored.format, repositoryName: source.success ? source.data.repo : stored.repositoryName,
    repositoryUrl: source.success ? source.data.repositoryUrl : null, logs, errorCode: error.success ? error.data : stored.errorCode ? 'DEPLOYMENT_FAILED' : null,
    pagesUrl: stored.status === 'LIVE' ? stored.pagesUrl : null, startedAt: stored.startedAt.toISOString(),
    completedAt: stored.completedAt?.toISOString() ?? null, updatedAt: stored.updatedAt.toISOString() });
}
export function createDeploymentService(repository: DeploymentRepository, queue: Pick<DeploymentQueue, 'enqueue'>) {
  return {
    capability: repository.capability,
    async start(userId: string, projectId: string, input: StartDeploymentInput) {
      const stored = await repository.start(userId, projectId, input);
      // PostgreSQL is the durable outbox. The worker reconciles pending rows after a queue outage.
      if (['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING'].includes(stored.status)) await queue.enqueue(stored.id).catch(() => {});
      return deploymentDto(stored);
    },
    async list(userId: string, projectId: string, query: DeploymentQuery) {
      const result = await repository.list(userId, projectId, query);
      return { items: result.items.map(deploymentDto), total: result.total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(result.total / query.pageSize) };
    },
    async get(userId: string, id: string) {
      const stored = await repository.find(userId, id);
      if (!stored) throw new ServiceError(404, 'DEPLOYMENT_NOT_FOUND', 'This deployment could not be found.');
      return deploymentDto(stored);
    },
  };
}
export type DeploymentService = ReturnType<typeof createDeploymentService>;
