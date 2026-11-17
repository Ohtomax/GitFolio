import { CreateProjectSchema, IdParamsSchema, ProjectPageSchema, ProjectQuerySchema, ProjectSchema,
  UpdateProjectSchema, type CreateProjectInput, type ProjectQuery, type UpdateProjectInput } from '@gitfolio/shared';
import { z } from 'zod';
import { apiFetch } from './api.ts';

export const projectService = {
  list(filters: Partial<ProjectQuery> = {}, signal?: AbortSignal) {
    const query = ProjectQuerySchema.parse(filters);
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize), sort: query.sort });
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    return apiFetch(`/api/projects?${params}`, ProjectPageSchema, { signal });
  },
  get(id: string, signal?: AbortSignal) {
    IdParamsSchema.parse({ id });
    return apiFetch(`/api/projects/${id}`, ProjectSchema, { signal });
  },
  create(input: CreateProjectInput) {
    const data = CreateProjectSchema.parse(input);
    return apiFetch('/api/projects', ProjectSchema, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  update(id: string, input: UpdateProjectInput) {
    IdParamsSchema.parse({ id });
    const data = UpdateProjectSchema.parse(input);
    return apiFetch(`/api/projects/${id}`, ProjectSchema, { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  delete(id: string) {
    IdParamsSchema.parse({ id });
    return apiFetch(`/api/projects/${id}`, z.null(), { method: 'DELETE' });
  },
};
