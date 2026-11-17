import { IdParamsSchema, TemplatePageSchema, TemplateQuerySchema, TemplateSchema, type TemplateQuery } from '@gitfolio/shared';
import { apiFetch } from './api.ts';

export const templateService = {
  list(filters: Partial<TemplateQuery> = {}, signal?: AbortSignal) {
    const query = TemplateQuerySchema.parse(filters);
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
    if (query.category) params.set('category', query.category);
    return apiFetch(`/api/templates?${params}`, TemplatePageSchema, { signal });
  },
  get(id: string, signal?: AbortSignal) {
    IdParamsSchema.parse({ id });
    return apiFetch(`/api/templates/${id}`, TemplateSchema, { signal });
  },
};
