import { ProjectSchema, ProjectSummarySchema, TemplateConfigSchema,
  type CreateProjectInput, type Project, type ProjectPage, type ProjectQuery, type ProjectSummary, type SaveEditorInput, type UpdateProjectInput } from '@gitfolio/shared';
import { ServiceError } from '../../utils/service-error.js';
import type { TemplateRepository } from '../template/template.repository.js';
import type { ProjectRepository, StoredProject, StoredProjectSummary } from './project.repository.js';

function summary(stored: StoredProjectSummary): ProjectSummary {
  const { _count, createdAt, updatedAt, ...metadata } = stored;
  const parsed = ProjectSummarySchema.safeParse({ ...metadata, createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(), sectionCount: _count.sections });
  if (!parsed.success) throw new ServiceError(503, 'PROJECT_UNAVAILABLE', 'This project is temporarily unavailable.');
  return parsed.data;
}
function detail(stored: StoredProject): Project {
  const parsed = ProjectSchema.safeParse({ ...summary(stored), editorRevision: stored.editorRevision, themeConfig: stored.themeConfig, sections: stored.sections });
  if (!parsed.success) throw new ServiceError(503, 'PROJECT_UNAVAILABLE', 'This project is temporarily unavailable.');
  return parsed.data;
}

export function createProjectService(repository: ProjectRepository, templates: TemplateRepository) {
  return {
    async list(userId: string, query: ProjectQuery): Promise<ProjectPage> {
      const result = await repository.list(userId, query);
      return { items: result.items.map(summary), total: result.total,
        page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(result.total / query.pageSize) };
    },
    async get(userId: string, id: string): Promise<Project> {
      const stored = await repository.findById(userId, id);
      if (!stored) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'This project could not be found.');
      return detail(stored);
    },
    async create(userId: string, input: CreateProjectInput): Promise<Project> {
      const template = await templates.findById(input.templateId);
      if (!template) throw new ServiceError(404, 'TEMPLATE_NOT_FOUND', 'This template could not be found.');
      const parsed = TemplateConfigSchema.safeParse(template.defaultConfig);
      if (!parsed.success) throw new ServiceError(503, 'TEMPLATES_UNAVAILABLE', 'This template is temporarily unavailable.');
      return detail(await repository.create(userId, input, parsed.data));
    },
    async update(userId: string, id: string, input: UpdateProjectInput): Promise<Project> {
      return detail(await repository.update(userId, id, input));
    },
    delete: (userId: string, id: string) => repository.delete(userId, id),
    async saveEditor(userId: string, id: string, input: SaveEditorInput): Promise<Project> {
      return detail(await repository.saveEditor(userId, id, input));
    },
  };
}
export type ProjectService = ReturnType<typeof createProjectService>;
