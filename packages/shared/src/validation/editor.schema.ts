import { z } from 'zod';
import { SectionTypeSchema, ThemeConfigSchema } from './template.schema.js';

export const PortfolioUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (value === '') return true;
  if (/^mailto:[^\s<>@?]+@[^\s<>@?]+\.[^\s<>@?]+$/.test(value)) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}, 'Use an http://, https://, or mailto: link.');
export const EditorItemSchema = z.object({
  title: z.string().max(120), subtitle: z.string().max(160).optional(),
  description: z.string().max(2000).optional(), url: PortfolioUrlSchema.optional(),
}).strict();
export const SectionContentSchema = z.object({
  heading: z.string().max(120), description: z.string().max(5000), eyebrow: z.string().max(100).optional(),
  buttonLabel: z.string().max(80).optional(), buttonUrl: PortfolioUrlSchema.optional(),
  items: z.array(EditorItemSchema).max(20).optional(),
}).strict();
export const EditorSectionSchema = z.object({
  id: z.string().uuid(), type: SectionTypeSchema, content: SectionContentSchema, visible: z.boolean(),
}).strict();
export const SaveEditorSchema = z.object({
  baseRevision: z.number().int().min(0).max(2147483646), themeConfig: ThemeConfigSchema,
  sections: z.array(EditorSectionSchema).max(50),
}).strict().superRefine((value, context) => {
  if (new Set(value.sections.map((section) => section.id)).size !== value.sections.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['sections'], message: 'Each section must have its own ID.' });
  }
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 900000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'This portfolio is too large to save. Remove some content and try again.' });
  }
});
export type SectionContent = z.infer<typeof SectionContentSchema>;
export type EditorItem = z.infer<typeof EditorItemSchema>;
export type EditorSection = z.infer<typeof EditorSectionSchema>;
export type SaveEditorInput = z.infer<typeof SaveEditorSchema>;
