import { TemplateConfigSchema, type TemplateConfig } from '@gitfolio/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

const sections: TemplateConfig['sections'] = [
  { type: 'hero', content: { heading: 'Your name', description: 'What you build, and why it matters.' }, visible: true },
  { type: 'about', content: { heading: 'A little about me', description: '' }, visible: true },
  { type: 'projects', content: { heading: 'Selected work', description: '' }, visible: true },
  { type: 'skills', content: { heading: 'Tools of the trade', description: '' }, visible: true },
  { type: 'contact', content: { heading: 'Let’s build something', description: '' }, visible: true },
];
const definitions = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Canvas', category: 'minimal',
    description: 'Clean lines and generous space. A quiet backdrop that lets your work speak.',
    isReact: false, accent: '#65a30d', background: '#fafaf9', text: '#1c1917', font: 'sans', spacing: 'spacious' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Terminal', category: 'developer',
    description: 'A dark canvas, bright accents, and a developer’s attention to detail.',
    isReact: true, accent: '#a3e635', background: '#1c1917', text: '#fafaf9', font: 'mono', spacing: 'comfortable' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Editorial', category: 'professional',
    description: 'Thoughtful typography and a warm palette for a story worth reading.',
    isReact: false, accent: '#b45309', background: '#fffbeb', text: '#292524', font: 'serif', spacing: 'spacious' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Studio', category: 'creative',
    description: 'A playful accent and a confident layout for makers with their own point of view.',
    isReact: false, accent: '#7c3aed', background: '#f5f3ff', text: '#2e1065', font: 'sans', spacing: 'comfortable' },
] as const;

export const templateSeedData = definitions.map((definition) => {
  const { accent, background, text, font, spacing, ...metadata } = definition;
  const defaultConfig = TemplateConfigSchema.parse({
    theme: { colors: { accent, background, text }, font, spacing }, sections,
  });
  return { ...metadata, thumbnailUrl: null, defaultConfig } satisfies Prisma.TemplateCreateManyInput;
});

export async function seedTemplates(database: Pick<PrismaClient, 'template'>) {
  // Stable IDs and skipDuplicates preserve existing catalog edits and project references.
  return database.template.createMany({ data: templateSeedData, skipDuplicates: true });
}
