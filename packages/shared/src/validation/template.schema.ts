import { z } from 'zod';
import { SectionContentSchema } from './section-content.schema.js';

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
export const PortfolioLayoutSchema = z.enum(['classic', 'minimal', 'terminal', 'editorial', 'bento', 'executive', 'backend', 'security', 'quality', 'frontend', 'fullstack']);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const ThemeConfigSchema = z.object({
  colors: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    muted: color.optional(), surface: color.optional(), border: color.optional(),
    primary: color.optional(), success: color.optional(), warning: color.optional(), danger: color.optional(),
  }).strict(),
  font: z.enum(['sans', 'serif', 'mono']),
  spacing: z.enum(['compact', 'comfortable', 'spacious']),
  layout: PortfolioLayoutSchema.optional(), headingFont: z.enum(['sans', 'serif', 'mono']).optional(),
  demo: z.boolean().optional(),
}).strict();
export const SectionTypeSchema = z.enum(['hero', 'about', 'projects', 'skills', 'experience', 'education', 'contact', 'writing', 'now', 'interactive']);
export const TemplateConfigSchema = z.object({
  theme: ThemeConfigSchema,
  sections: z.array(z.object({
    type: SectionTypeSchema,
    content: SectionContentSchema,
    visible: z.boolean(),
  }).strict()).min(1).max(50),
}).strict();
export const TemplateQuerySchema = PaginationQuerySchema.extend({ category: TemplateCategorySchema.optional() }).strict();
export const TemplateSummarySchema = z.object({
  id: z.string().uuid(), name: z.string(), description: z.string(), category: TemplateCategorySchema,
  thumbnailUrl: z.string().url().nullable(), isReact: z.boolean(),
  preview: ThemeConfigSchema.optional(),
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
