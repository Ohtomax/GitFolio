import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { seedTemplates, templateSeedData } from '../dist/modules/template/template.seed.js';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createTemplateRepository } from '../dist/modules/template/template.repository.js';

const databaseUrl = process.env.GITFOLIO_TEST_DATABASE_URL;
test('real PostgreSQL preserves seed IDs, enforces owner-scoped CRUD, and stores independent defaults', {
  skip: databaseUrl ? false : 'Set GITFOLIO_TEST_DATABASE_URL to a migrated disposable database',
}, async () => {
  assert.match(new URL(databaseUrl).pathname.slice(1), /^gitfolio_phase1_test_[a-z0-9_]+$/);
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });
  const ownerId = randomUUID(), otherId = randomUUID();
  try {
    await seedTemplates(database);
    assert.equal((await seedTemplates(database)).count, 0);
    await database.user.createMany({ data: [ownerId, otherId].map((id) => ({ id, githubId: id,
      login: 'fixture-user', encryptedAccessToken: 'fixture-ciphertext' })) });
    const service = createProjectService(createProjectRepository(database), createTemplateRepository(database));
    const input = { name: 'Fixture portfolio', slug: 'same-slug', templateId: templateSeedData[0].id };
    const created = await service.create(ownerId, input);
    assert.equal(created.sectionCount, templateSeedData[0].defaultConfig.sections.length);
    assert.equal(created.themeConfig.colors.accent, templateSeedData[0].defaultConfig.theme.colors.accent);
    assert.equal((await service.create(otherId, input)).slug, input.slug);
    await assert.rejects(service.create(ownerId, input), { code: 'P2002' });
    await assert.rejects(service.get(otherId, created.id), { code: 'PROJECT_NOT_FOUND' });
    await assert.rejects(service.update(otherId, created.id, { name: 'Forbidden' }), { code: 'P2025' });
    await assert.rejects(service.delete(otherId, created.id), { code: 'P2025' });
    assert.equal((await service.update(ownerId, created.id, { status: 'ARCHIVED' })).status, 'ARCHIVED');
    assert.equal((await service.list(ownerId, { page: 1, pageSize: 12, sort: 'updated' })).total, 1);
    await service.delete(ownerId, created.id);
    assert.equal(await database.section.count({ where: { projectId: created.id } }), 0);
  } finally {
    await database.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await database.$disconnect();
  }
});
