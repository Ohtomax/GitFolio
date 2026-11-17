import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient, type DeploymentStatus } from '@prisma/client';
import { ProjectSchema, PublishCapabilitySchema, type DeploymentQuery, type StartDeploymentInput } from '@gitfolio/shared';
import { projectSelect } from '../project/project.repository.js';
import { ServiceError } from '../../utils/service-error.js';

export const activeStatuses: DeploymentStatus[] = ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING'];
export const deploymentSelect = { id: true, projectId: true, status: true, editorRevision: true, source: true, repositoryName: true, format: true,
  errorCode: true, commitSha: true, pagesUrl: true, buildUrl: true, logs: true, startedAt: true, completedAt: true, updatedAt: true } satisfies Prisma.DeploymentSelect;
export type StoredDeployment = Prisma.DeploymentGetPayload<{ select: typeof deploymentSelect }>;
export const asJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const scopesFor = (react: boolean): ('repo' | 'workflow')[] => react ? ['repo', 'workflow'] : ['repo'];
const allowed = (scopes: string, react: boolean) => scopesFor(react).every((scope) => scopes.split(/[\s,]+/).includes(scope));
export function createDeploymentRepository(database: PrismaClient) {
  return {
    async capability(userId: string, projectId: string) {
      const project = await database.project.findUnique({ where: { id_userId: { id: projectId, userId } },
        select: { repoName: true, slug: true, editorRevision: true, status: true, template: { select: { isReact: true } }, user: { select: { githubScopes: true } } } });
      if (!project) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.');
      const active = await database.deployment.findFirst({ where: { projectId, userId, status: { in: activeStatuses } }, select: { id: true } });
      return PublishCapabilitySchema.parse({ format: project.template.isReact ? 'react' : 'static', repositoryName: project.repoName ?? `gitfolio-${project.slug}`,
        requiredScopes: scopesFor(project.template.isReact), authorized: allowed(project.user.githubScopes, project.template.isReact),
        archived: project.status === 'ARCHIVED', editorRevision: project.editorRevision, activeDeploymentId: active?.id ?? null });
    },
    async start(userId: string, projectId: string, input: StartDeploymentInput): Promise<StoredDeployment> {
      try {
        return await database.$transaction(async (transaction) => {
          const existing = await transaction.deployment.findUnique({ where: { userId_requestKey: { userId, requestKey: input.requestId } }, select: deploymentSelect });
          if (existing) {
            if (existing.projectId !== projectId || existing.editorRevision !== input.editorRevision || existing.repositoryName !== input.repositoryName || existing.format !== input.format) throw new ServiceError(409, 'DEPLOYMENT_REQUEST_CONFLICT', 'Use a new publishing request for this saved version and target.');
            return existing;
          }
          // Lock the same project row as editor saves to capture one consistent revision and section set.
          const gate = await transaction.project.updateMany({ where: { id: projectId, userId, editorRevision: input.editorRevision, status: { not: 'ARCHIVED' } }, data: { editorRevision: { increment: 0 } } });
          if (gate.count !== 1) {
            const current = await transaction.project.findUnique({ where: { id_userId: { id: projectId, userId } }, select: { status: true } });
            if (!current) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.');
            throw new ServiceError(409, current.status === 'ARCHIVED' ? 'PROJECT_ARCHIVED' : 'EDITOR_CONFLICT', 'Reload the saved project before publishing.');
          }
          // Recheck after taking the row lock: another identical request may have committed while waiting.
          const repeated = await transaction.deployment.findUnique({ where: { userId_requestKey: { userId, requestKey: input.requestId } }, select: deploymentSelect });
          if (repeated) {
            if (repeated.projectId !== projectId || repeated.repositoryName !== input.repositoryName || repeated.format !== input.format || repeated.editorRevision !== input.editorRevision) throw new ServiceError(409, 'DEPLOYMENT_REQUEST_CONFLICT', 'Use a new publishing request for this saved version and target.');
            return repeated;
          }
          const active = await transaction.deployment.findFirst({ where: { projectId, status: { in: activeStatuses } }, select: { id: true } });
          if (active) throw new ServiceError(409, 'DEPLOYMENT_ACTIVE', 'A deployment is already active for this project. Open its history to follow it.');
          const project = await transaction.project.findUniqueOrThrow({ where: { id_userId: { id: projectId, userId } }, select: projectSelect });
          const user = await transaction.user.findUniqueOrThrow({ where: { id: userId }, select: { githubScopes: true } });
          if ((project.repoName ?? `gitfolio-${project.slug}`) !== input.repositoryName || (project.template.isReact ? 'react' : 'static') !== input.format) throw new ServiceError(409, 'DEPLOYMENT_REQUEST_CONFLICT', 'The publishing target changed. Reload before publishing.');
          if (!allowed(user.githubScopes, project.template.isReact)) throw new ServiceError(403, 'GITHUB_PERMISSION_REQUIRED', 'Authorize GitHub publishing access first.');
          const snapshot = ProjectSchema.parse({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(), sectionCount: project._count.sections });
          return transaction.deployment.create({ data: { id: randomUUID(), userId, projectId, requestKey: input.requestId,
            editorRevision: input.editorRevision, repositoryName: input.repositoryName, format: input.format,
            snapshot: asJson(snapshot), logs: [{ at: new Date().toISOString(), code: 'QUEUED' }] }, select: deploymentSelect });
        }, { maxWait: 5000, timeout: 15000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const existing = await database.deployment.findUnique({ where: { userId_requestKey: { userId, requestKey: input.requestId } }, select: deploymentSelect });
          if (existing && existing.projectId === projectId && existing.editorRevision === input.editorRevision && existing.repositoryName === input.repositoryName && existing.format === input.format) return existing;
          throw new ServiceError(409, 'DEPLOYMENT_ACTIVE', 'A deployment is already active or this request was already used.');
        }
        throw error;
      }
    },
    async list(userId: string, projectId: string, query: DeploymentQuery) {
      const project = await database.project.findUnique({ where: { id_userId: { id: projectId, userId } }, select: { id: true } });
      if (!project) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.');
      const where = { userId, projectId };
      const [items, total] = await database.$transaction([
        database.deployment.findMany({ where, select: deploymentSelect, orderBy: [{ startedAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        database.deployment.count({ where }),
      ]);
      return { items, total };
    },
    find: (userId: string, id: string) => database.deployment.findFirst({ where: { id, userId }, select: deploymentSelect }),
  };
}
export type DeploymentRepository = ReturnType<typeof createDeploymentRepository>;
