import { z } from 'zod';
import { SectionTypeSchema, ThemeConfigSchema } from './template.schema.js';
import { SectionContentSchema } from './section-content.schema.js';
export { PortfolioUrlSchema, EditorItemSchema, SectionContentSchema } from './section-content.schema.js';
import type { EditorItemSchema } from './section-content.schema.js';

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
