import type { Prisma, PrismaClient } from '@prisma/client';
import type { CreateProjectInput, ProjectQuery, TemplateConfig, UpdateProjectInput } from '@gitfolio/shared';
import { templateSummarySelect } from '../template/template.repository.js';

const projectSummarySelect = {
  id: true, templateId: true, name: true, slug: true, repoName: true, status: true, createdAt: true, updatedAt: true,
  template: { select: templateSummarySelect }, _count: { select: { sections: true } },
} satisfies Prisma.ProjectSelect;
const projectSelect = { ...projectSummarySelect, themeConfig: true,
  sections: { select: { id: true, type: true, sortOrder: true, content: true, visible: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 50 },
} satisfies Prisma.ProjectSelect;
export type StoredProjectSummary = Prisma.ProjectGetPayload<{ select: typeof projectSummarySelect }>;
export type StoredProject = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export interface ProjectRepository {
  list(userId: string, query: ProjectQuery): Promise<{ items: StoredProjectSummary[]; total: number }>;
  findById(userId: string, id: string): Promise<StoredProject | null>;
  create(userId: string, input: CreateProjectInput, defaults: TemplateConfig): Promise<StoredProject>;
  update(userId: string, id: string, input: UpdateProjectInput): Promise<StoredProject>;
  delete(userId: string, id: string): Promise<void>;
}

export function createProjectRepository(database: PrismaClient): ProjectRepository {
  return {
    async list(userId, query) {
      const where: Prisma.ProjectWhereInput = { userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      };
      const [items, total] = await database.$transaction([
        database.project.findMany({ where, select: projectSummarySelect,
          orderBy: query.sort === 'name' ? [{ name: 'asc' }, { id: 'asc' }] : [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        database.project.count({ where }),
      ]);
      return { items, total };
    },
    findById: (userId, id) => database.project.findUnique({ where: { id_userId: { id, userId } }, select: projectSelect }),
    create: (userId, input, defaults) => database.project.create({ data: {
      userId, name: input.name, slug: input.slug, repoName: input.repoName ?? null, templateId: input.templateId,
      themeConfig: defaults.theme,
      sections: { create: defaults.sections.map((section, sortOrder) => ({ ...section, sortOrder })) },
    }, select: projectSelect }),
    update: (userId, id, input) => database.project.update({ where: { id_userId: { id, userId } },
      data: input, select: projectSelect }),
    async delete(userId, id) {
      await database.project.delete({ where: { id_userId: { id, userId } }, select: { id: true } });
    },
  };
}
