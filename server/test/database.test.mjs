import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { DEPLOY_STATUSES } from '@gitfolio/shared';

const databaseUrl = process.env.GITFOLIO_TEST_DATABASE_URL;

test('migration enforces relationships, ownership, uniqueness, and cascade cleanup', {
  skip: databaseUrl ? false : 'Set GITFOLIO_TEST_DATABASE_URL to a migrated disposable database',
}, async () => {
  const databaseName = new URL(databaseUrl).pathname.slice(1);
  assert.match(databaseName, /^gitfolio_phase1_test_[a-z0-9_]+$/,
    'Integration tests require an explicitly named disposable test database');

  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const ownerId = randomUUID();
  const otherId = randomUUID();
  const templateId = randomUUID();
  const projectId = randomUUID();

  try {
    await database.user.createMany({ data: [ownerId, otherId].map((id) => ({
      id, githubId: id, login: 'fixture-user', encryptedAccessToken: 'fixture-ciphertext',
    })) });
    await database.template.create({ data: {
      id: templateId, name: 'Fixture template', description: 'Integration fixture', category: 'minimal',
    } });
    const project = await database.project.create({ data: {
      id: projectId, userId: ownerId, templateId, name: 'Fixture project', slug: 'same-slug',
      sections: { create: { type: 'hero', content: { heading: 'Fixture' } } },
    } });
    assert.equal(project.status, 'DRAFT');
    assert.deepEqual(project.themeConfig, {});

    await assert.rejects(database.project.create({ data: {
      userId: ownerId, templateId, name: 'Duplicate', slug: 'same-slug',
    } }), { code: 'P2002' });
    await database.project.create({ data: {
      userId: otherId, templateId, name: 'Other owner', slug: 'same-slug',
    } });

    await assert.rejects(database.deployment.create({ data: {
      projectId, userId: otherId,
    } }), { code: 'P2003' });

    for (const status of DEPLOY_STATUSES) {
      await database.deployment.create({ data: { projectId, userId: ownerId, status } });
    }
    await assert.rejects(database.template.delete({ where: { id: templateId } }));
    assert.equal(await database.template.count({ where: { id: templateId } }), 1);

    await database.project.delete({ where: { id: projectId } });
    assert.equal(await database.section.count({ where: { projectId } }), 0);
    assert.equal(await database.deployment.count({ where: { projectId } }), 0);
    await database.user.delete({ where: { id: otherId } });
    assert.equal(await database.project.count({ where: { userId: otherId } }), 0);
  } finally {
    try {
      await database.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
      await database.template.deleteMany({ where: { id: templateId } });
    } finally {
      await database.$disconnect();
    }
  }
});
