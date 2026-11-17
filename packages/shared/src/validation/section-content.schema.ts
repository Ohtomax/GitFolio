import { z } from 'zod';
import { RoleWidgetSchema } from './role-widget.schema.js';

export function isPortfolioUrl(value: string): boolean {
  if (value.length > 2048) return false;
  if (value === '') return true;
  if (/^mailto:[^\s<>@?]+@[^\s<>@?]+\.[^\s<>@?]+$/.test(value)) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
export const PortfolioUrlSchema = z.string().trim().max(2048).refine(isPortfolioUrl, 'Use an http://, https://, or mailto: link.');
export const ProjectVisualSchema = z.enum(['dashboard', 'mobile', 'typography', 'architecture', 'code']);
export const RoleMetricSchema = z.object({ value: z.string().max(24), label: z.string().max(80) }).strict();
export const FigmaUrlSchema = z.string().trim().max(2048).refine((value) => { if(!value)return true;try{const url=new URL(value);return url.protocol==='https:'&&['www.figma.com','figma.com','embed.figma.com'].includes(url.hostname)&&!url.username&&!url.password&&/^\/(design|proto|board|file)\/[A-Za-z0-9]+(?:\/|$)/.test(url.pathname);}catch{return false;} },'Use an HTTPS Figma file or prototype URL.');
export const EditorItemSchema = z.object({
  title: z.string().max(120), subtitle: z.string().max(160).optional(),
  description: z.string().max(2000).optional(), url: PortfolioUrlSchema.optional(),
  visual: ProjectVisualSchema.optional(), tags: z.array(z.string().max(40)).max(12).optional(),
  metrics: z.array(RoleMetricSchema).max(4).optional(),
  embedUrl: FigmaUrlSchema.optional(), embedLabel: z.string().max(160).optional(),
}).strict();
export const SectionContentSchema = z.object({
  heading: z.string().max(120), description: z.string().max(5000), eyebrow: z.string().max(100).optional(),
  subtitle: z.string().max(180).optional(), buttonLabel: z.string().max(80).optional(), buttonUrl: PortfolioUrlSchema.optional(),
  items: z.array(EditorItemSchema).max(20).optional(), tags: z.array(z.string().max(40)).max(12).optional(),
  metrics: z.array(RoleMetricSchema).max(4).optional(), widget: RoleWidgetSchema.optional(),
}).strict();
