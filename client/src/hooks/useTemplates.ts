import { queryOptions, useQuery } from '@tanstack/react-query';
import { TemplateQuerySchema, type TemplateQuery } from '@gitfolio/shared';
import { templateService } from '../services/template.service.ts';
import { useAuthStore } from '../stores/auth.store.ts';

export const templateKeys = { all: ['templates'] as const,
  list: (query: TemplateQuery) => ['templates', 'list', query] as const,
  detail: (id: string) => ['templates', 'detail', id] as const };
export function templateListOptions(filters: Partial<TemplateQuery> = {}) {
  const query = TemplateQuerySchema.parse(filters);
  return queryOptions({ queryKey: templateKeys.list(query), queryFn: ({ signal }) => templateService.list(query, signal), staleTime: 5 * 60000 });
}
export function templateDetailOptions(id: string) {
  return queryOptions({ queryKey: templateKeys.detail(id), queryFn: ({ signal }) => templateService.get(id, signal),
    staleTime: 5 * 60000, enabled: Boolean(id) });
}
export function useTemplates(filters: Partial<TemplateQuery> = {}) {
  const signedIn = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({ ...templateListOptions(filters), enabled: signedIn });
}
export function useTemplate(id: string) {
  const signedIn = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({ ...templateDetailOptions(id), enabled: signedIn && Boolean(id) });
}
