import { DeploymentPageSchema, DeploymentQuerySchema, DeploymentSchema, IdParamsSchema, PublishCapabilitySchema,
  StartDeploymentSchema, type DeploymentQuery, type StartDeploymentInput } from '@gitfolio/shared';
import { apiFetch } from './api.ts';

const validId = (id: string) => IdParamsSchema.parse({ id }).id;
export const deploymentService = {
  capability: (projectId: string, signal?: AbortSignal) => apiFetch(`/api/projects/${validId(projectId)}/publish`, PublishCapabilitySchema, { signal }),
  list(projectId: string, filters: Partial<DeploymentQuery> = {}, signal?: AbortSignal) {
    const query = DeploymentQuerySchema.parse(filters);
    return apiFetch(`/api/projects/${validId(projectId)}/deployments?${new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })}`, DeploymentPageSchema, { signal });
  },
  get: (id: string, signal?: AbortSignal) => apiFetch(`/api/deployments/${validId(id)}/status`, DeploymentSchema, { signal }),
  start(projectId: string, input: StartDeploymentInput) {
    const body = StartDeploymentSchema.parse(input);
    return apiFetch(`/api/projects/${validId(projectId)}/deploy`, DeploymentSchema, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  },
};
