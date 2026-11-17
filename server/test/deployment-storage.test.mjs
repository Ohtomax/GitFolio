import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { SaveEditorSchema } from '@gitfolio/shared';
import { featureFixture } from './helpers/features.mjs';
import { createDeploymentRouter } from '../dist/modules/deployment/deployment.route.js';
import { createDeploymentRepository } from '../dist/modules/deployment/deployment.repository.js';
import { createDeploymentWorkerRepository } from '../dist/modules/deployment/deployment-worker.repository.js';
import { createDeploymentService } from '../dist/modules/deployment/deployment.service.js';
import { createDeploymentProcessor } from '../dist/modules/deployment/deployment.processor.js';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createTemplateRepository } from '../dist/modules/template/template.repository.js';
import { seedTemplates, templateSeedData } from '../dist/modules/template/template.seed.js';

const databaseUrl = process.env.GITFOLIO_TEST_DATABASE_URL;
test('real deployment storage enforces ownership/idempotency, captures immutable revisions, recovers queue outages, and fences workers', {
  skip: databaseUrl ? false : 'Set a migrated disposable GITFOLIO_TEST_DATABASE_URL', timeout: 30000,
}, async (t) => {
  assert.match(new URL(databaseUrl).pathname.slice(1), /^gitfolio_phase1_test_[a-z0-9_]+$/);
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });
  const repository = createDeploymentRepository(db), worker = createDeploymentWorkerRepository(db);
  const service = createDeploymentService(repository, { async enqueue() { throw new Error('Redis is unavailable'); } });
  const f = await featureFixture(t, guard => ({ deploymentRouter: createDeploymentRouter(service, guard) }));
  const inputFor = (project) => ({ requestId: randomUUID(), editorRevision: project.editorRevision,
    repositoryName: project.repoName ?? `gitfolio-${project.slug}`, format: project.template.isReact ? 'react' : 'static' });
  try {
    await seedTemplates(db);
    await db.user.createMany({ data: [f.ownerId, f.otherId].map(id => ({ id, githubId: id, login: 'fixture-user', encryptedAccessToken: 'private-fixture-cipher', githubScopes: '' })) });
    const projects = createProjectService(createProjectRepository(db), createTemplateRepository(db));
    const project = await projects.create(f.ownerId, { name: 'Publish fixture', slug: 'publish-fixture', templateId: templateSeedData[0].id });
    const input = inputFor(project);
    assert.equal((await f.request(`/projects/${project.id}/publish`).then(r => r.json())).data.authorized, false);
    assert.equal((await f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify(input) })).status, 403);
    assert.equal((await f.request(`/projects/${project.id}/deploy`, { method: 'POST', headers: { Authorization: `Bearer ${f.otherToken}` }, body: JSON.stringify(input) })).status, 404);
    await db.user.update({ where: { id: f.ownerId }, data: { githubScopes: 'repo,workflow' } });
    const changedTarget = await f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify({ ...input, repositoryName: 'a-different-target' }) });
    assert.equal(changedTarget.status, 409); assert.equal((await changedTarget.json()).error.code, 'DEPLOYMENT_REQUEST_CONFLICT');
    const responses = await Promise.all([1, 2].map(() => f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify(input) })));
    assert.deepEqual(responses.map(r => r.status), [202, 202]);
    const first = (await responses[0].json()).data, second = (await responses[1].json()).data;
    assert.equal(first.id, second.id); assert.equal(await db.deployment.count({ where: { projectId: project.id } }), 1);
    const collision = await projects.create(f.ownerId, { name: 'Target collision', slug: 'target-collision', repoName: input.repositoryName.toUpperCase(), templateId: templateSeedData[0].id });
    await assert.rejects(repository.start(f.ownerId, collision.id, inputFor(collision)), { code: 'DEPLOYMENT_ACTIVE' });
    assert.ok((await worker.recoverable()).some(row => row.id === first.id));
    assert.equal((await f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify({ ...input, requestId: randomUUID() }) })).status, 409);
    const editor = SaveEditorSchema.parse({ baseRevision: 0, themeConfig: project.themeConfig,
      sections: project.sections.map(({ sortOrder, ...section }) => section) });
    editor.sections[0].content.heading = 'Newer editor content';
    await projects.saveEditor(f.ownerId, project.id, editor);
    let published = '', writes = 0, checks = 0;
    const source = { owner: 'fixture-user', repo: input.repositoryName, repositoryId: '123', commitSha: 'a'.repeat(40), repositoryUrl: `https://github.com/fixture-user/${input.repositoryName}`, format: 'static' };
    const processor = createDeploymentProcessor(worker, { async getAccessToken(userId) { assert.equal(userId, f.ownerId); return 'private-token-fixture'; } }, (_access, active) => ({
      async prepare() { await active(); return {}; }, async publish(_context, _id, files) { await active(); published = files.map(file => file.content).join('\n'); writes++; return source; },
      async check() { checks++; return checks === 1 ? { status: 'pending' } : { status: 'live', pagesUrl: `https://fixture-user.github.io/${input.repositoryName}/` }; },
    }));
    assert.deepEqual(await processor(first.id), { retryAfterMs: 5000 });
    assert.ok(!published.includes('Newer editor content')); assert.equal(writes, 1);
    assert.equal((await db.deployment.findUnique({ where: { id: first.id } })).status, 'DEPLOYING');
    await processor(first.id); assert.equal(writes, 1);
    const live = (await f.request(`/deployments/${first.id}/status`).then(r => r.json())).data;
    assert.equal(live.status, 'LIVE'); assert.equal(live.editorRevision, 0);
    assert.deepEqual(live.logs.map(log => log.code), ['QUEUED', 'BUILDING', 'PUSHING', 'DEPLOYING', 'LIVE']);
    assert.ok(!JSON.stringify(live).match(/snapshot|private-token|private-fixture|encrypted/));
    assert.equal((await projects.get(f.ownerId, project.id)).status, 'PUBLISHED');
    assert.equal((await f.request(`/deployments/${first.id}/status`, { headers: { Authorization: `Bearer ${f.otherToken}` } })).status, 404);
    assert.equal((await f.request(`/projects/${project.id}/deployments`, { headers: { Authorization: `Bearer ${f.otherToken}` } })).status, 404);
    const fresh = await projects.create(f.ownerId, { name: 'Lease fixture', slug: 'lease-fixture', templateId: templateSeedData[0].id });
    const leaseJob = await repository.start(f.ownerId, fresh.id, inputFor(fresh));
    let clock = Date.now(); const leases = createDeploymentWorkerRepository(db, () => clock);
    const oldToken = randomUUID(), newToken = randomUUID();
    assert.ok((await leases.claim(leaseJob.id, oldToken)).record);
    assert.equal((await leases.claim(leaseJob.id, newToken)).busy, true);
    clock += 91000; assert.ok((await leases.claim(leaseJob.id, newToken)).record);
    await assert.rejects(leases.assertActive(leaseJob.id, oldToken), { code: 'DEPLOYMENT_LEASE_LOST' });
    assert.equal(await leases.heartbeat(leaseJob.id, oldToken), false);
    await leases.release(leaseJob.id, oldToken);
    assert.equal(await leases.heartbeat(leaseJob.id, newToken), true);
    await leases.transition(leaseJob.id, newToken, 'FAILED', 'DEPLOYMENT_FAILED', { errorCode: 'DEPLOYMENT_FAILED' });
    const failed = await repository.start(f.ownerId, fresh.id, inputFor(fresh));
    const failure = createDeploymentProcessor(worker, { async getAccessToken() { return 'private-token'; } }, () => ({ async prepare() { throw new Error('private-provider-PII-token'); } }));
    await assert.rejects(failure(failed.id), { message: 'Deployment could not finish' });
    assert.ok(!JSON.stringify(await service.get(f.ownerId, failed.id)).includes('private-provider'));
    assert.equal((await service.get(f.ownerId, failed.id)).errorCode, 'DEPLOYMENT_FAILED');
    const fastFailure = await repository.start(f.ownerId, fresh.id, inputFor(fresh));
    const buildUrl = 'https://github.com/fixture-user/gitfolio-lease-fixture/actions/runs/789';
    const fastProcessor = createDeploymentProcessor(worker, { async getAccessToken() { return 'private-token'; } }, () => ({
      async prepare() { return {}; }, async publish() { return { ...source, repo: 'gitfolio-lease-fixture', repositoryUrl: 'https://github.com/fixture-user/gitfolio-lease-fixture' }; },
      async check() { return { status: 'failed', buildUrl }; },
    }));
    await assert.rejects(fastProcessor(fastFailure.id));
    const failedBuild = await service.get(f.ownerId, fastFailure.id);
    assert.equal(failedBuild.errorCode, 'BUILD_FAILED'); assert.equal(failedBuild.buildUrl, buildUrl);
    const race = await projects.create(f.ownerId, { name: 'Race fixture', slug: 'race-fixture', templateId: templateSeedData[0].id });
    const raceEdit = SaveEditorSchema.parse({ baseRevision: 0, themeConfig: race.themeConfig, sections: race.sections.map(({ sortOrder, ...section }) => section) });
    raceEdit.sections[0].content.heading = 'Concurrent edit';
    const [capture, edited] = await Promise.allSettled([repository.start(f.ownerId, race.id, inputFor(race)), projects.saveEditor(f.ownerId, race.id, raceEdit)]);
    assert.equal(edited.status, 'fulfilled');
    if (capture.status === 'fulfilled') {
      const captured = await db.deployment.findUnique({ where: { id: capture.value.id }, select: { snapshot: true, editorRevision: true } });
      assert.equal(captured.editorRevision, 0); assert.equal(captured.snapshot.sections[0].content.heading, race.sections[0].content.heading);
    } else assert.equal(capture.reason.code, 'EDITOR_CONFLICT');
    await projects.update(f.ownerId, project.id, { status: 'ARCHIVED' });
    assert.equal((await f.request(`/projects/${project.id}/deploy`, { method: 'POST', body: JSON.stringify({ ...input, requestId: randomUUID(), editorRevision: 1 }) })).status, 409);
  } finally { try { await db.user.deleteMany({ where: { id: { in: [f.ownerId, f.otherId] } } }); } finally { await db.$disconnect(); } }
});
