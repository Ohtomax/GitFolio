import { TemplateSchema, TemplateSummarySchema, TemplateConfigSchema, type Template, type TemplatePage, type TemplateQuery } from '@gitfolio/shared';
import { ServiceError } from '../../utils/service-error.js';
import type { TemplateRepository } from './template.repository.js';

export function createTemplateService(repository: TemplateRepository) {
  return {
    async list(query: TemplateQuery): Promise<TemplatePage> {
      const result = await repository.list(query);
      const parsed = TemplateSummarySchema.array().safeParse(result.items.map((item) => {
        const defaults = 'defaultConfig' in item ? TemplateConfigSchema.safeParse(item.defaultConfig) : undefined;
        return { ...item, ...(defaults?.success ? { preview: defaults.data.theme } : {}) };
      }));
      if (!parsed.success) throw new ServiceError(503, 'TEMPLATES_UNAVAILABLE', 'Templates are temporarily unavailable.');
      return { ...query, items: parsed.data, total: result.total, totalPages: Math.ceil(result.total / query.pageSize) };
    },
    async get(id: string): Promise<Template> {
      const stored = await repository.findById(id);
      if (!stored) throw new ServiceError(404, 'TEMPLATE_NOT_FOUND', 'This template could not be found.');
      const parsed = TemplateSchema.safeParse(stored);
      if (!parsed.success) throw new ServiceError(503, 'TEMPLATES_UNAVAILABLE', 'This template is temporarily unavailable.');
      return { ...parsed.data, preview: parsed.data.defaultConfig.theme };
    },
  };
}
export type TemplateService = ReturnType<typeof createTemplateService>;
