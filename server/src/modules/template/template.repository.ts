import type { Prisma, PrismaClient } from '@prisma/client';
import type { TemplateQuery } from '@gitfolio/shared';

export const templateSummarySelect = {
  id: true, name: true, description: true, category: true, thumbnailUrl: true, isReact: true,
} satisfies Prisma.TemplateSelect;
const templateSelect = { ...templateSummarySelect, defaultConfig: true } satisfies Prisma.TemplateSelect;
export type StoredTemplateSummary = Prisma.TemplateGetPayload<{ select: typeof templateSummarySelect }>;
export type StoredTemplate = Prisma.TemplateGetPayload<{ select: typeof templateSelect }>;
export interface TemplateRepository {
  list(query: TemplateQuery): Promise<{ items: StoredTemplateSummary[]; total: number }>;
  findById(id: string): Promise<StoredTemplate | null>;
}

export function createTemplateRepository(database: PrismaClient): TemplateRepository {
  return {
    async list(query) {
      const where: Prisma.TemplateWhereInput = query.category ? { category: query.category } : {};
      const [items, total] = await database.$transaction([
        database.template.findMany({ where, select: templateSelect,
          orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        database.template.count({ where }),
      ]);
      return { items, total };
    },
    findById: (id) => database.template.findUnique({ where: { id }, select: templateSelect }),
  };
}
