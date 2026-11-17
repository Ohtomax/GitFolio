import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { featureFixture } from './helpers/features.mjs';
import { createDeploymentRouter } from '../dist/modules/deployment/deployment.route.js';
import { ServiceError } from '../dist/utils/service-error.js';

test('deployment endpoints validate before services, require authentication/origin, and use the verified owner', async (t) => {
  let calls = 0;
  const id = randomUUID();
  const f = await featureFixture(t, (guard, ownerId) => ({ deploymentRouter: createDeploymentRouter({
    async capability(userId, projectId) { calls++; if (userId !== ownerId) throw new ServiceError(404, 'PROJECT_NOT_FOUND', 'Not found.'); return { projectId }; },
    async start(userId, projectId, input) { calls++; assert.equal(userId, ownerId); assert.equal(projectId, id); return { id: randomUUID(), ...input }; },
    async list(_user, _id, query) { calls++; return query; }, async get(userId) { calls++; if (userId !== ownerId) throw new ServiceError(404, 'DEPLOYMENT_NOT_FOUND', 'Not found.'); return {}; },
  }, guard) }));
  assert.equal((await fetch(`${f.url}/projects/${id}/publish`)).status, 401);
  const input = { requestId: randomUUID(), editorRevision: 0, repositoryName: 'portfolio', format: 'static' };
  for (const body of [{ ...input, userId: f.otherId }, { ...input, editorRevision: -1 }, { ...input, repositoryName: '../private' }]) {
    assert.equal((await f.request(`/projects/${id}/deploy`, { method: 'POST', body: JSON.stringify(body) })).status, 400);
  }
  assert.equal((await f.request('/projects/invalid/deployments')).status, 400);
  assert.equal((await f.request(`/projects/${id}/deployments?pageSize=10000`)).status, 400);
  assert.equal(calls, 0);
  assert.equal((await f.request(`/projects/${id}/deploy`, { method: 'POST', body: JSON.stringify(input) })).status, 202);
  const cookie = { Authorization: '', Cookie: `gitfolio_session=${f.token}` };
  assert.equal((await f.request(`/projects/${id}/deploy`, { method: 'POST', headers: cookie, body: JSON.stringify(input) })).status, 403);
  assert.equal((await f.request(`/deployments/${id}/status`, { headers: { Authorization: `Bearer ${f.otherToken}` } })).status, 404);
  assert.equal((await f.request(`/projects/${id}/publish`, { headers: { Authorization: `Bearer ${f.otherToken}` } })).status, 404);
});
