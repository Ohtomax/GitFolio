import { z } from 'zod';
import { DEPLOYMENT_MESSAGES } from '../constants/deployment-messages.js';
import { DEPLOY_STATUSES } from '../constants/deploy-status.js';
import { PageMetaSchema, PaginationQuerySchema } from './template.schema.js';
import { RepoNameSchema } from './project.schema.js';

const githubUrl = (pages: boolean) => z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
    && (pages ? /^[a-z0-9-]+\.github\.io$/i.test(url.hostname) : url.hostname === 'github.com');
});
export const DeploymentLogCodeSchema = z.enum(Object.keys(DEPLOYMENT_MESSAGES) as [keyof typeof DEPLOYMENT_MESSAGES, ...(keyof typeof DEPLOYMENT_MESSAGES)[]]);
export const StartDeploymentSchema = z.object({ requestId: z.string().uuid(), editorRevision: z.number().int().nonnegative().max(2147483646),
  repositoryName: RepoNameSchema, format: z.enum(['static', 'react']) }).strict();
export const DeploymentQuerySchema = PaginationQuerySchema;
export const DeploymentSchema = z.object({ id: z.string().uuid(), projectId: z.string().uuid(), status: z.enum(DEPLOY_STATUSES),
  editorRevision: z.number().int().nonnegative(), format: z.enum(['static', 'react']).nullable(), repositoryName: RepoNameSchema.nullable(),
  repositoryUrl: githubUrl(false).nullable(), pagesUrl: githubUrl(true).nullable(), buildUrl: githubUrl(false).nullable(),
  commitSha: z.string().regex(/^[a-f0-9]{40}$/).nullable(), errorCode: DeploymentLogCodeSchema.nullable(),
  logs: z.array(z.object({ at: z.string().datetime(), code: DeploymentLogCodeSchema, message: z.string().max(300) })).max(30),
  startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(), updatedAt: z.string().datetime(),
});
export const DeploymentPageSchema = PageMetaSchema.extend({ items: z.array(DeploymentSchema).max(50) });
export const PublishCapabilitySchema = z.object({ format: z.enum(['static', 'react']), repositoryName: RepoNameSchema,
  requiredScopes: z.array(z.enum(['repo', 'workflow'])).max(2), authorized: z.boolean(), archived: z.boolean(),
  editorRevision: z.number().int().nonnegative(), activeDeploymentId: z.string().uuid().nullable() });
export type StartDeploymentInput = z.infer<typeof StartDeploymentSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type DeploymentQuery = z.infer<typeof DeploymentQuerySchema>;
export type DeploymentPage = z.infer<typeof DeploymentPageSchema>;
export type PublishCapability = z.infer<typeof PublishCapabilitySchema>;
