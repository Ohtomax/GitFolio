import { z } from 'zod';
import { PageMetaSchema, PaginationQuerySchema, SectionTypeSchema, TemplateSummarySchema, ThemeConfigSchema } from './template.schema.js';

export const ProjectNameSchema = z.string().trim().min(1, 'Enter a project name.').max(100, 'Use 100 characters or fewer.')
  .refine((value) => !/[<>\u0000-\u001f\u007f]/.test(value), 'Use plain text for the project name.');
export const ProjectSlugSchema = z.string().trim().min(1, 'Enter a project slug.').max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.');
export const RepoNameSchema = z.string().trim().min(1).max(100)
  .regex(/^[A-Za-z0-9._-]+$/, 'Use letters, numbers, dots, underscores, or hyphens.')
  .refine((value) => value !== '.' && value !== '..' && !value.endsWith('.git'), 'Choose a valid repository name.');
export const ProjectStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const CreateProjectSchema = z.object({
  name: ProjectNameSchema, slug: ProjectSlugSchema, templateId: z.string().uuid(),
  repoName: RepoNameSchema.nullable().optional(),
}).strict();
export const UpdateProjectSchema = z.object({
  name: ProjectNameSchema.optional(), slug: ProjectSlugSchema.optional(),
  repoName: RepoNameSchema.nullable().optional(), status: z.enum(['DRAFT', 'ARCHIVED']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');
export const ProjectQuerySchema = PaginationQuerySchema.extend({
  status: ProjectStatusSchema.optional(), search: z.string().trim().max(80).optional(),
  sort: z.enum(['updated', 'name']).default('updated'),
}).strict();
export const ProjectSummarySchema = z.object({
  id: z.string().uuid(), templateId: z.string().uuid(), name: ProjectNameSchema,
  slug: ProjectSlugSchema, repoName: RepoNameSchema.nullable(), status: ProjectStatusSchema,
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  sectionCount: z.number().int().nonnegative(), template: TemplateSummarySchema,
});
export const ProjectSectionSchema = z.object({ id: z.string().uuid(), type: SectionTypeSchema,
  sortOrder: z.number().int().nonnegative(), content: z.record(z.unknown()), visible: z.boolean() });
export const ProjectSchema = ProjectSummarySchema.extend({
  themeConfig: ThemeConfigSchema, sections: z.array(ProjectSectionSchema).max(50),
});
export const ProjectPageSchema = PageMetaSchema.extend({ items: z.array(ProjectSummarySchema).max(50) });
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectQuery = z.infer<typeof ProjectQuerySchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectPage = z.infer<typeof ProjectPageSchema>;
