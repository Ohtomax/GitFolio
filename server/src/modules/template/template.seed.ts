import { BUILTIN_TEMPLATES, TemplateConfigSchema, type TemplateConfig } from '@gitfolio/shared';
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

export const legacyTemplateSeedData = definitions.map((definition) => {
  const { accent, background, text, font, spacing, ...metadata } = definition;
  const defaultConfig = TemplateConfigSchema.parse({
    theme: { colors: { accent, background, text }, font, spacing }, sections,
  });
  return { ...metadata, thumbnailUrl: null, defaultConfig } satisfies Prisma.TemplateCreateManyInput;
});
export const templateSeedData = [
  ...legacyTemplateSeedData.map((legacy) => {
    const preset = BUILTIN_TEMPLATES.find((item) => item.id === legacy.id);
    return preset ? { id: preset.id, name: preset.name, category: preset.category, description: preset.description,
      isReact: preset.isReact, thumbnailUrl: preset.thumbnailUrl, defaultConfig: TemplateConfigSchema.parse(preset.defaultConfig) } : legacy;
  }),
  ...BUILTIN_TEMPLATES.filter((preset) => !legacyTemplateSeedData.some((legacy) => legacy.id === preset.id))
    .map(({ preview: _preview, ...preset }) => preset),
] satisfies Prisma.TemplateCreateManyInput[];

export async function seedTemplates(database: Pick<PrismaClient, 'template'>) {
  const created = await database.template.createMany({ data: templateSeedData, skipDuplicates: true });
  let updated = 0;
  for (const legacy of legacyTemplateSeedData) {
    const replacement = BUILTIN_TEMPLATES.find((preset) => preset.id === legacy.id);
    if (!replacement) continue;
    // Compare the complete old fingerprint atomically. Edited catalog rows and project
    // snapshots are never overwritten, including during concurrent seeding.
    const result = await database.template.updateMany({ where: { id: legacy.id, name: legacy.name,
      description: legacy.description, category: legacy.category, isReact: legacy.isReact,
      thumbnailUrl: legacy.thumbnailUrl, defaultConfig: { equals: legacy.defaultConfig as Prisma.InputJsonValue } },
      data: { name: replacement.name, description: replacement.description, category: replacement.category,
        isReact: replacement.isReact, thumbnailUrl: replacement.thumbnailUrl, defaultConfig: replacement.defaultConfig } });
    updated += result.count;
  }
  const reservedIds = BUILTIN_TEMPLATES.flatMap((preset) => [preset.id, preset.id.replace(/^10000000/, '20000000')]);
  const stored = await database.template.findMany({ where: { id: { in: reservedIds } }, select: { id: true, defaultConfig: true } });
  const layouts = new Set(stored.flatMap((row) => {
    const config = TemplateConfigSchema.safeParse(row.defaultConfig);
    return config.success && config.data.theme.layout ? [config.data.theme.layout] : [];
  }));
  const missingDesigns = BUILTIN_TEMPLATES.filter((preset) => !layouts.has(preset.defaultConfig.theme.layout!));
  // An edited legacy row keeps its ID and content. Add the new design under a
  // second reserved ID instead of making that archetype unavailable.
  const additional = missingDesigns.length ? await database.template.createMany({ skipDuplicates: true,
    data: missingDesigns.map(({ preview: _preview, ...preset }) => ({ ...preset, id: preset.id.replace(/^10000000/, '20000000') })) }) : { count: 0 };
  return { count: created.count + additional.count, updated };
}
