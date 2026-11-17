import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { SaveEditorSchema } from '@gitfolio/shared';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createTemplateRepository } from '../dist/modules/template/template.repository.js';
import { seedTemplates, templateSeedData } from '../dist/modules/template/template.seed.js';

const databaseUrl = process.env.GITFOLIO_TEST_DATABASE_URL;
test('real editor transactions serialize tabs, roll back foreign IDs, preserve section creation times, and support removal/restore', {
  skip: databaseUrl ? false : 'Set GITFOLIO_TEST_DATABASE_URL to a migrated disposable database',
}, async () => {
  assert.match(new URL(databaseUrl).pathname.slice(1), /^gitfolio_phase1_test_[a-z0-9_]+$/);
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });
  const ownerId = randomUUID(), otherId = randomUUID();
  const inputFor = (project) => SaveEditorSchema.parse({ baseRevision: project.editorRevision, themeConfig: project.themeConfig,
    sections: project.sections.map(({ sortOrder, ...section }) => section) });
  try {
    await seedTemplates(database);
    await database.user.createMany({ data: [ownerId, otherId].map((id) => ({ id, githubId: id, login: 'fixture-user', encryptedAccessToken: 'fixture-ciphertext' })) });
    const service = createProjectService(createProjectRepository(database), createTemplateRepository(database));
    const original = await service.create(ownerId, { name: 'Editor fixture', slug: 'editor-fixture', templateId: templateSeedData[0].id });
    const foreign = await service.create(otherId, { name: 'Other fixture', slug: 'other-fixture', templateId: templateSeedData[0].id });
    const before = await database.section.findUnique({ where: { id: original.sections[0].id }, select: { createdAt: true } });
    const first = inputFor(original);
    first.sections[0].content.heading = 'Changed';
    const saved = await service.saveEditor(ownerId, original.id, first);
    assert.equal(saved.editorRevision, 1);
    const after = await database.section.findUnique({ where: { id: original.sections[0].id }, select: { createdAt: true } });
    assert.equal(before.createdAt.getTime(), after.createdAt.getTime());
    const invalid = inputFor(saved); invalid.sections[0].id = foreign.sections[0].id;
    await assert.rejects(service.saveEditor(ownerId, original.id, invalid), { code: 'INVALID_EDITOR_CONTENT' });
    assert.equal((await service.get(ownerId, original.id)).editorRevision, 1);
    await assert.rejects(service.saveEditor(otherId, original.id, inputFor(saved)), { code: 'PROJECT_NOT_FOUND' });
    const tabs = ['One', 'Two'].map((title, index) => {
      const input = inputFor(saved); input.sections[0].content.heading = title;
      input.themeConfig.colors.accent = index === 0 ? '#111111' : '#222222';
      return service.saveEditor(ownerId, original.id, input);
    });
    const results = await Promise.allSettled(tabs);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.find((result) => result.status === 'rejected').reason.code, 'EDITOR_CONFLICT');
    const current = await service.get(ownerId, original.id);
    assert.equal(current.editorRevision, 2);
    assert.equal(current.themeConfig.colors.accent, current.sections[0].content.heading === 'One' ? '#111111' : '#222222');
    const empty = await service.saveEditor(ownerId, original.id, { ...inputFor(current), sections: [] });
    assert.equal(empty.sections.length, 0);
    const restored = await service.saveEditor(ownerId, original.id, { ...inputFor(current), baseRevision: empty.editorRevision });
    assert.equal(restored.sections.length, current.sections.length);
    await service.update(ownerId, original.id, { status: 'ARCHIVED' });
    await assert.rejects(service.saveEditor(ownerId, original.id, inputFor(restored)), { code: 'PROJECT_ARCHIVED' });
  } finally {
    try { await database.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } }); }
    finally { await database.$disconnect(); }
  }
});
