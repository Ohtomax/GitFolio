import { z } from 'zod';

export const IdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
}).strict();
export const PageMetaSchema = z.object({
  page: z.number().int().positive(), pageSize: z.number().int().min(1).max(50),
  total: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
});
export const TemplateCategorySchema = z.enum(['minimal', 'developer', 'professional', 'creative']);
export const ThemeConfigSchema = z.object({
  colors: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }).strict(),
  font: z.enum(['sans', 'serif', 'mono']),
  spacing: z.enum(['compact', 'comfortable', 'spacious']),
}).strict();
export const SectionTypeSchema = z.enum(['hero', 'about', 'projects', 'skills', 'experience', 'education', 'contact']);
export const TemplateConfigSchema = z.object({
  theme: ThemeConfigSchema,
  sections: z.array(z.object({
    type: SectionTypeSchema,
    content: z.object({ heading: z.string().max(120), description: z.string().max(2000) }).strict(),
    visible: z.boolean(),
  }).strict()).min(1).max(50),
}).strict();
export const TemplateQuerySchema = PaginationQuerySchema.extend({ category: TemplateCategorySchema.optional() }).strict();
export const TemplateSummarySchema = z.object({
  id: z.string().uuid(), name: z.string(), description: z.string(), category: TemplateCategorySchema,
  thumbnailUrl: z.string().url().nullable(), isReact: z.boolean(),
});
export const TemplateSchema = TemplateSummarySchema.extend({ defaultConfig: TemplateConfigSchema });
export const TemplatePageSchema = PageMetaSchema.extend({ items: z.array(TemplateSummarySchema).max(50) });
export type TemplateQuery = z.infer<typeof TemplateQuerySchema>;
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type TemplatePage = z.infer<typeof TemplatePageSchema>;
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
