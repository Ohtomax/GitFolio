import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { BUILTIN_TEMPLATES, SaveEditorSchema } from '@gitfolio/shared';
import { seedTemplates, legacyTemplateSeedData, templateFallbackId } from '../dist/modules/template/template.seed.js';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createTemplateRepository } from '../dist/modules/template/template.repository.js';

const url = process.env.GITFOLIO_TEST_TEMPLATE_DATABASE_URL;
test('real PostgreSQL upgrades only untouched legacy presets, preserves drafts, and round-trips every catalog preset', {
  skip: url ? false : 'Set a separate migrated GITFOLIO_TEST_TEMPLATE_DATABASE_URL',
}, async () => {
  assert.match(new URL(url).pathname.slice(1), /^gitfolio_phase1_test_templates_[a-z0-9_]+$/);
  const database = new PrismaClient({ datasources: { db: { url } }, log: [] });
  const userId = randomUUID();
  let fixturesCreated = false;
  try {
    assert.equal(await database.user.count(), 0, 'Use a separate empty disposable database');
    assert.equal(await database.template.count(), 0, 'Use a separate empty disposable database');
    await database.template.createMany({ data: legacyTemplateSeedData });
    fixturesCreated = true;
    await database.user.create({ data: { id: userId, githubId: userId, login: 'template-fixture', encryptedAccessToken: 'synthetic-ciphertext' } });
    const service = createProjectService(createProjectRepository(database), createTemplateRepository(database));
    const legacy = await service.create(userId, { name: 'Legacy portfolio', slug: 'legacy', templateId: legacyTemplateSeedData[0].id });
    await database.template.update({ where: { id: legacyTemplateSeedData[1].id }, data: { name: 'A custom catalog edit' } });
    const seeded = await seedTemplates(database);
    assert.equal(seeded.count, BUILTIN_TEMPLATES.length - legacyTemplateSeedData.length + 1); assert.equal(seeded.updated, 3);
    assert.equal((await seedTemplates(database)).updated, 0);
    const refreshed = await service.get(userId, legacy.id);
    assert.deepEqual(refreshed.themeConfig, legacy.themeConfig);
    assert.deepEqual(refreshed.sections, legacy.sections);
    assert.equal(refreshed.editorRevision, legacy.editorRevision);
    assert.equal(refreshed.updatedAt, legacy.updatedAt);
    assert.equal(legacy.themeConfig.layout, undefined);
    assert.equal((await database.template.findUnique({ where: { id: legacyTemplateSeedData[1].id } })).name, 'A custom catalog edit');
    for (const [index, template] of BUILTIN_TEMPLATES.entries()) {
      const available = await database.template.findFirst({ where: { id: { in: [template.id, templateFallbackId(template.id)] },
        defaultConfig: { path: ['theme', 'layout'], equals: template.defaultConfig.theme.layout } }, select: { id: true } });
      assert.ok(available, 'Every design stays available alongside custom legacy edits');
      const project = await service.create(userId, { name: `Design ${index}`, slug: `design-${index}`, templateId: available.id });
      assert.deepEqual(project.themeConfig, template.defaultConfig.theme);
      assert.deepEqual(project.sections.map(({ id, sortOrder, ...section }) => section), template.defaultConfig.sections);
      const input = SaveEditorSchema.parse({ baseRevision: project.editorRevision, themeConfig: { ...project.themeConfig, headingFont: 'serif', demo: false },
        sections: project.sections.map(({ sortOrder, ...section }) => section) });
      input.sections[0].content.metrics = [{ value: '42', label: 'A user-supplied metric' }];
      if (template.defaultConfig.theme.layout === 'monochrome') {
        input.sections[0].content.portraitUrl = 'https://example.com/custom-portrait.png';
        input.sections[0].content.portraitAlt = 'A custom portrait saved with the draft';
      }
      await service.saveEditor(userId, project.id, input);
      const saved = await service.get(userId, project.id);
      assert.equal(saved.themeConfig.headingFont, 'serif'); assert.equal(saved.themeConfig.demo, false);
      assert.deepEqual(saved.sections[0].content.metrics, input.sections[0].content.metrics);
      assert.deepEqual(saved.sections.map(({ sortOrder, ...section }) => section), input.sections);
    }
    const listed = await service.list(userId, { page: 1, pageSize: 50, sort: 'updated' });
    assert.equal(listed.items.length, BUILTIN_TEMPLATES.length + 1);
    for (const item of listed.items) assert.ok(item.preview);
  } finally {
    await database.user.deleteMany({ where: { id: userId } });
    if (fixturesCreated && await database.user.count() === 0) await database.template.deleteMany({ where: { id: { in: [...legacyTemplateSeedData.map((row) => row.id), ...BUILTIN_TEMPLATES.flatMap((row) => [row.id, templateFallbackId(row.id)])] } } });
    await database.$disconnect();
  }
});
