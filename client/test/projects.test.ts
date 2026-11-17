import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import type { Project } from '@gitfolio/shared';
import { createProjectMutationOptions, deleteProjectMutationOptions, projectDetailOptions,
  projectKeys, projectListOptions, updateProjectMutationOptions } from '../src/hooks/useProjects.ts';
import { templateListOptions } from '../src/hooks/useTemplates.ts';
import { projectService } from '../src/services/project.service.ts';
import { useAuthStore } from '../src/stores/auth.store.ts';

const userId = randomUUID();
const otherId = randomUUID();
const template = { id: randomUUID(), name: 'Canvas', description: 'Fixture template', category: 'minimal' as const,
  thumbnailUrl: null, isReact: false };
const project: Project = { id: randomUUID(), templateId: template.id, template,
  editorRevision: 0,
  name: 'My portfolio', slug: 'my-portfolio', repoName: null, status: 'DRAFT',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sectionCount: 1,
  themeConfig: { colors: { accent: '#65a30d', background: '#fafaf9', text: '#1c1917' }, font: 'sans', spacing: 'spacious' },
  sections: [{ id: randomUUID(), type: 'hero', content: { heading: 'Your name', description: '' }, sortOrder: 0, visible: true }] };
const input = { name: project.name, slug: project.slug, templateId: project.templateId };
const emptyPage = { items: [], total: 0, totalPages: 0, page: 1, pageSize: 12 };
test.beforeEach(() => useAuthStore.getState().setSession({ user: { id: userId, githubId: '123', login: 'fixture-user',
  name: null, email: null, avatarUrl: null }, expiresAt: Date.now() + 3600000 }));

test('project/template queries validate responses, forward signals, and keep owners out of URL parameters', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  const paths: string[] = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    paths.push(String(path));
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ success: true, data: String(path).includes('/templates')
      ? { ...emptyPage, items: [template], total: 1, totalPages: 1 } : emptyPage });
  });
  await queryClient.fetchQuery(projectListOptions(userId, { search: 'my work', page: 2 }));
  await queryClient.fetchQuery(templateListOptions({ category: 'minimal' }));
  assert.match(paths[0], /search=my\+work/);
  assert.ok(!paths.join().includes(userId));
  assert.match(paths[1], /category=minimal/);
  assert.notDeepEqual(projectListOptions(userId).queryKey, projectListOptions(otherId).queryKey);
  assert.equal(projectDetailOptions('', '').enabled, false);
});

test('create mutation invalidates only the current owner lists and seeds the returned detail cache', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  const key = projectListOptions(userId).queryKey;
  const otherKey = projectListOptions(otherId).queryKey;
  queryClient.setQueryData(key, emptyPage);
  queryClient.setQueryData(otherKey, emptyPage);
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    assert.equal(path, '/api/projects'); assert.equal(init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(init?.body)), input);
    return Response.json({ success: true, data: project });
  });
  await new MutationObserver(queryClient, createProjectMutationOptions(queryClient, userId)).mutate(input);
  assert.equal(queryClient.getQueryState(key)?.isInvalidated, true);
  assert.equal(queryClient.getQueryState(otherKey)?.isInvalidated, false);
  assert.deepEqual(queryClient.getQueryData(projectKeys.detail(userId, project.id)), project);
});

test('update and delete mutations refresh lists and remove only the relevant cached detail', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  queryClient.setQueryData(projectKeys.detail(userId, project.id), project);
  queryClient.setQueryData(projectKeys.detail(otherId, project.id), project);
  t.mock.method(globalThis, 'fetch', async (_path, init) => Response.json({ success: true,
    data: init?.method === 'DELETE' ? null : { ...project, name: 'Updated' } }));
  await new MutationObserver(queryClient, updateProjectMutationOptions(queryClient, userId)).mutate({ id: project.id, data: { name: 'Updated' } });
  assert.equal(queryClient.getQueryData<Project>(projectKeys.detail(userId, project.id))?.name, 'Updated');
  await new MutationObserver(queryClient, deleteProjectMutationOptions(queryClient, userId)).mutate(project.id);
  assert.equal(queryClient.getQueryData(projectKeys.detail(userId, project.id)), undefined);
  assert.ok(queryClient.getQueryData(projectKeys.detail(otherId, project.id)));
});

test('a mutation finishing after logout cannot repopulate old user caches', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  let started: () => void = () => {};
  let finish: (response: Response) => void = () => {};
  const ready = new Promise<void>((resolve) => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async () => new Promise<Response>((resolve) => { finish = resolve; started(); }));
  const pending = new MutationObserver(queryClient, createProjectMutationOptions(queryClient, userId)).mutate(input);
  await ready;
  useAuthStore.getState().clearSession();
  queryClient.clear();
  finish(Response.json({ success: true, data: project }));
  await pending;
  assert.equal(queryClient.getQueryData(projectKeys.detail(userId, project.id)), undefined);
});

test('invalid mutation inputs fail before sending a request', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ success: true, data: project }); });
  assert.throws(() => projectService.create({ ...input, slug: 'Invalid Slug' }));
  assert.throws(() => projectService.update('not-a-uuid', { name: 'Test' }));
  assert.equal(calls, 0);
});
