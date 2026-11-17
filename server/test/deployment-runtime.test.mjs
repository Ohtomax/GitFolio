import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { startDeploymentWorker } from '../dist/core/deployment-worker.js';
import { createDeploymentQueue } from '../dist/queues/deployment.queue.js';
import { createDeploymentRepository } from '../dist/modules/deployment/deployment.repository.js';
import { createDeploymentService } from '../dist/modules/deployment/deployment.service.js';
import { createDeploymentRouter } from '../dist/modules/deployment/deployment.route.js';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createTemplateRepository } from '../dist/modules/template/template.repository.js';
import { seedTemplates, templateSeedData } from '../dist/modules/template/template.seed.js';
import { createEncryptionService } from '../dist/utils/encryption.js';
import { featureFixture } from './helpers/features.mjs';

const databaseUrl = process.env.GITFOLIO_TEST_RUNTIME_DATABASE_URL, redisUrl = process.env.GITFOLIO_TEST_REDIS_URL;
test('real API/outbox/BullMQ worker recovers a missing job, survives restart, and confirms a matching simulated GitHub build', {
  skip: databaseUrl && redisUrl ? false : 'Set separate migrated GITFOLIO_TEST_RUNTIME_DATABASE_URL and disposable Redis URL', timeout: 30000,
}, async (t) => {
  assert.match(new URL(databaseUrl).pathname.slice(1), /^gitfolio_phase1_test_runtime_[a-z0-9_]+$/);
  assert.notEqual(databaseUrl, process.env.GITFOLIO_TEST_DATABASE_URL, 'The runtime worker requires its own fixture database');
  const logger = pino({ level: 'silent' }), prefix = `gitfolio_test_runtime_${randomUUID()}`;
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });
  const queue = createDeploymentQueue(redisUrl, logger, prefix);
  const repository = createDeploymentRepository(db);
  const service = createDeploymentService(repository, { async enqueue() { throw new Error('Simulated enqueue outage'); } });
  const f = await featureFixture(t, guard => ({ deploymentRouter: createDeploymentRouter(service, guard) }));
  const environment = EnvironmentSchema.parse({ NODE_ENV: 'test', CLIENT_URL: 'http://localhost:5173', DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl, GITHUB_CLIENT_ID: 'fixture-client', GITHUB_CLIENT_SECRET: 'fixture-secret', ENCRYPTION_KEY: 'e'.repeat(32) });
  const githubId = String(Date.now()), encryption = createEncryptionService(environment.ENCRYPTION_KEY);
  let runtime, writes = 0, checks = 0;
  const publisher = (accessToken, active) => ({
    async prepare(expectedId, repo, projectId) { assert.equal(accessToken, 'fixture-worker-token'); assert.equal(expectedId, githubId); await active(); return { repo, projectId }; },
    async publish(context, _id, files) {
      await active(); writes++; assert.ok(files.some(file => file.path === 'index.html'));
      return { owner: 'fixture-publisher', repo: context.repo, repositoryId: '123', commitSha: 'a'.repeat(40),
        repositoryUrl: `https://github.com/fixture-publisher/${context.repo}`, format: 'static' };
    },
    async check(source) { await active(); checks++; return checks === 1 ? { status: 'pending' } : { status: 'live', pagesUrl: `https://fixture-publisher.github.io/${source.repo}/` }; },
  });
  try {
    await queue.queue.waitUntilReady(); await seedTemplates(db);
    await db.user.create({ data: { id: f.ownerId, githubId, login: 'fixture-publisher', githubScopes: 'repo',
      encryptedAccessToken: encryption.encrypt('fixture-worker-token', `github:${githubId}:access`) } });
    const projects = createProjectService(createProjectRepository(db), createTemplateRepository(db));
    const project = await projects.create(f.ownerId, { name: 'Runtime fixture', slug: 'runtime-fixture', repoName: 'runtime-fixture', templateId: templateSeedData[0].id });
    const result = await f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify({ requestId: randomUUID(), editorRevision: 0, repositoryName: 'runtime-fixture', format: 'static' }) });
    assert.equal(result.status, 202); const deployment = (await result.json()).data;
    assert.equal(await queue.queue.getJob(deployment.id), undefined);
    runtime = await startDeploymentWorker(environment, logger, { publisher, queuePrefix: prefix });
    const deadline = Date.now() + 20000;
    let progress;
    while (Date.now() < deadline) {
      progress = await service.get(f.ownerId, deployment.id);
      const queued = await queue.queue.getJob(deployment.id);
      if (progress.status === 'DEPLOYING' && await queued?.getState() === 'delayed') break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(progress.status, 'DEPLOYING');
    await runtime.close();
    runtime = await startDeploymentWorker(environment, logger, { publisher, queuePrefix: prefix });
    while (Date.now() < deadline) {
      const response = await f.request(`/deployments/${deployment.id}/status`); assert.equal(response.status, 200);
      progress = (await response.json()).data; if (progress.status === 'LIVE' || progress.status === 'FAILED') break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(progress.status, 'LIVE'); assert.equal(writes, 1); assert.equal(checks, 2);
    assert.equal(progress.pagesUrl, 'https://fixture-publisher.github.io/runtime-fixture/');
    assert.ok(!JSON.stringify(progress).includes('fixture-worker-token'));
    assert.equal((await projects.get(f.ownerId, project.id)).status, 'PUBLISHED');
  } finally {
    try { await runtime?.close(); await queue.queue.obliterate({ force: true }); await queue.close(); }
    finally { try { await db.user.deleteMany({ where: { id: f.ownerId } }); } finally { await db.$disconnect(); } }
  }
});
