import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import type { Deployment } from '@gitfolio/shared';
import { deploymentDetailOptions, deploymentHistoryOptions, deploymentKeys, startDeploymentOptions } from '../src/hooks/useDeployments.ts';
import { deploymentService } from '../src/services/deployment.service.ts';
import { useAuthStore } from '../src/stores/auth.store.ts';

const owner = randomUUID(), other = randomUUID(), projectId = randomUUID();
const pending: Deployment = { id: randomUUID(), projectId, status: 'PENDING', editorRevision: 0, format: 'static',
  repositoryName: 'portfolio', repositoryUrl: null, pagesUrl: null, buildUrl: null, commitSha: null, errorCode: null, logs: [],
  startedAt: new Date().toISOString(), completedAt: null, updatedAt: new Date().toISOString() };
const input = { requestId: randomUUID(), editorRevision: 0, repositoryName: 'portfolio', format: 'static' as const };
const setSession = (id: string) => useAuthStore.getState().setSession({ user: { id, githubId: '123', login: 'fixture-user', name: null, email: null, avatarUrl: null }, expiresAt: Date.now() + 3600000 });
test.beforeEach(() => setSession(owner));

test('deployment polling forwards cancellation, partitions owners, and stops at terminal states', async (t) => {
  const client = new QueryClient(); t.after(() => client.clear());
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    assert.equal(path, `/api/deployments/${pending.id}/status`); assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ success: true, data: pending });
  });
  const options = deploymentDetailOptions(owner, pending.id);
  await client.fetchQuery(options);
  const query = client.getQueryCache().find({ queryKey: options.queryKey })!;
  assert.equal(options.refetchInterval(query), 3000);
  client.setQueryData(options.queryKey, { ...pending, status: 'LIVE' }); assert.equal(options.refetchInterval(query), false);
  client.setQueryData(options.queryKey, { ...pending, status: 'FAILED' }); assert.equal(options.refetchInterval(query), false);
  assert.equal(options.refetchIntervalInBackground, false);
  assert.notDeepEqual(options.queryKey, deploymentDetailOptions(other, pending.id).queryKey);
  assert.equal(deploymentDetailOptions('', pending.id).enabled, false);
  assert.equal(deploymentHistoryOptions(owner, 'invalid').enabled, false);
});
test('publishing seeds only the current owner cache and invalidates its history/capability', async (t) => {
  const client = new QueryClient(); t.after(() => client.clear());
  const history = deploymentHistoryOptions(owner, projectId).queryKey, otherHistory = deploymentHistoryOptions(other, projectId).queryKey;
  client.setQueryData(history, { items: [] }); client.setQueryData(otherHistory, { items: [] });
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    assert.equal(path, `/api/projects/${projectId}/deploy`); assert.equal(init?.method, 'POST'); assert.deepEqual(JSON.parse(String(init?.body)), input);
    return Response.json({ success: true, data: pending }, { status: 202 });
  });
  await new MutationObserver(client, startDeploymentOptions(client, owner)).mutate({ projectId, input });
  assert.equal(client.getQueryState(history)?.isInvalidated, true); assert.equal(client.getQueryState(otherHistory)?.isInvalidated, false);
  assert.deepEqual(client.getQueryData(deploymentKeys.detail(owner, pending.id)), pending);
});
test('publishing responses after an account switch cannot repopulate the previous account cache', async (t) => {
  const client = new QueryClient(); t.after(() => client.clear());
  let complete: (response: Response) => void = () => {}, started: () => void = () => {};
  const ready = new Promise<void>((resolve) => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async () => new Promise<Response>((resolve) => { complete = resolve; started(); }));
  const running = new MutationObserver(client, startDeploymentOptions(client, owner)).mutate({ projectId, input });
  await ready; setSession(other); client.clear(); complete(Response.json({ success: true, data: pending })); await running;
  assert.equal(client.getQueryData(deploymentKeys.detail(owner, pending.id)), undefined);
});
test('invalid targets fail before requests and unsafe returned links cannot enter the cache', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ success: true, data: { ...pending, pagesUrl: 'javascript:alert(1)' } }); });
  assert.throws(() => deploymentService.start(projectId, { ...input, repositoryName: '../private' })); assert.equal(calls, 0);
  await assert.rejects(deploymentService.get(pending.id), { code: 'INVALID_RESPONSE' });
});
