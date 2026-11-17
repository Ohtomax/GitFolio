import { Prisma, type PrismaClient, type DeploymentStatus } from '@prisma/client';
import { DeploymentLogCodeSchema, type DeploymentLogCode } from '@gitfolio/shared';
import { z } from 'zod';
import { activeStatuses, asJson } from './deployment.repository.js';
import { ServiceError } from '../../utils/service-error.js';

const logSchema = z.object({ at: z.string().datetime(), code: DeploymentLogCodeSchema });
export function createDeploymentWorkerRepository(database: PrismaClient, now = Date.now) {
  const leased = (id: string, token: string) => ({ id, leaseToken: token, leaseExpiresAt: { gt: new Date(now()) }, status: { in: activeStatuses } });
  return {
    async claim(id: string, token: string) {
      const result = await database.deployment.updateMany({ where: { id, status: { in: activeStatuses }, OR: [{ leaseToken: null }, { leaseExpiresAt: { lte: new Date(now()) } }] },
        data: { leaseToken: token, leaseExpiresAt: new Date(now() + 90000) } });
      if (!result.count) {
        const current = await database.deployment.findUnique({ where: { id }, select: { status: true } });
        return { busy: Boolean(current && activeStatuses.includes(current.status)), record: null };
      }
      const record = await database.deployment.findUnique({ where: { id }, select: { id: true, userId: true, projectId: true, status: true,
        snapshot: true, source: true, repositoryName: true, format: true, startedAt: true,
        user: { select: { githubId: true } }, project: { select: { status: true } } } });
      return { busy: false, record };
    },
    async assertActive(id: string, token: string) {
      const record = await database.deployment.findFirst({ where: leased(id, token), select: { project: { select: { status: true } }, startedAt: true } });
      if (!record) throw new ServiceError(409, 'DEPLOYMENT_LEASE_LOST', 'Publishing is continuing in another worker.');
      if (record.project.status === 'ARCHIVED') throw new ServiceError(409, 'PROJECT_ARCHIVED', 'This project was archived.');
      if (now() - record.startedAt.getTime() > 30 * 60000) throw new ServiceError(409, 'DEPLOYMENT_TIMEOUT', 'Publishing took too long.');
    },
    async heartbeat(id: string, token: string) {
      const result = await database.deployment.updateMany({ where: leased(id, token), data: { leaseExpiresAt: new Date(now() + 90000) } });
      return result.count === 1;
    },
    async transition(id: string, token: string, status: DeploymentStatus, code: DeploymentLogCode,
      data: { source?: Prisma.InputJsonValue; commitSha?: string; pagesUrl?: string; buildUrl?: string; errorCode?: string } = {}) {
      return database.$transaction(async (transaction) => {
        const current = await transaction.deployment.findFirst({ where: leased(id, token), select: { logs: true, projectId: true, userId: true } });
        if (!current) throw new ServiceError(409, 'DEPLOYMENT_LEASE_LOST', 'Publishing is continuing in another worker.');
        const logs = (Array.isArray(current.logs) ? current.logs : []).flatMap((entry) => { const parsed = logSchema.safeParse(entry); return parsed.success ? [parsed.data] : []; });
        if (logs.at(-1)?.code !== code) logs.push({ at: new Date(now()).toISOString(), code });
        const final = status === 'LIVE' || status === 'FAILED';
        const updated = await transaction.deployment.updateMany({ where: leased(id, token), data: { ...data, status, logs: asJson(logs.slice(-30)),
          ...(final ? { completedAt: new Date(now()), leaseToken: null, leaseExpiresAt: null } : {}) } });
        if (!updated.count) throw new ServiceError(409, 'DEPLOYMENT_LEASE_LOST', 'Publishing is continuing in another worker.');
        if (status === 'LIVE') {
          const project = await transaction.project.updateMany({ where: { id: current.projectId, userId: current.userId, status: { not: 'ARCHIVED' } }, data: { status: 'PUBLISHED' } });
          if (!project.count) throw new ServiceError(409, 'PROJECT_ARCHIVED', 'Publishing stopped because this project was archived.');
        }
      });
    },
    async release(id: string, token: string) {
      await database.deployment.updateMany({ where: { id, leaseToken: token }, data: { leaseToken: null, leaseExpiresAt: null } });
    },
    async recoverable() {
      return database.deployment.findMany({ where: { status: { in: activeStatuses }, snapshot: { not: Prisma.DbNull } },
        orderBy: { startedAt: 'asc' }, take: 100, select: { id: true } });
    },
  };
}
export type DeploymentWorkerRepository = ReturnType<typeof createDeploymentWorkerRepository>;
