import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { ProjectPageSchema, ProjectSchema } from '@gitfolio/shared';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createProjectRouter } from '../dist/modules/project/project.route.js';
import { templateSeedData } from '../dist/modules/template/template.seed.js';
import { featureFixture } from './helpers/features.mjs';

const missing = () => new Prisma.PrismaClientKnownRequestError('private-database-details', { code: 'P2025', clientVersion: 'fixture' });
async function fixture(t) {
  const rows = new Map();
  let writes = 0;
  const templates = structuredClone(templateSeedData);
  const repository = {
    async list(userId, query) {
      let items = [...rows.values()].filter((row) => row.userId === userId &&
        (!query.status || row.status === query.status) && (!query.search || row.name.toLowerCase().includes(query.search.toLowerCase())));
      items.sort((a, b) => query.sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt);
      return { total: items.length, items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize) };
    },
    async findById(userId, id) { const row = rows.get(id); return row?.userId === userId ? structuredClone(row) : null; },
    async create(userId, input, defaults) {
      if ([...rows.values()].some((row) => row.userId === userId && row.slug === input.slug)) {
        throw new Prisma.PrismaClientKnownRequestError('private-unique-index-details', { code: 'P2002', clientVersion: 'fixture' });
      }
      const row = { ...input, repoName: input.repoName ?? null, id: randomUUID(), userId, status: 'DRAFT',
        createdAt: new Date(), updatedAt: new Date(), themeConfig: structuredClone(defaults.theme),
        sections: defaults.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })),
        _count: { sections: defaults.sections.length }, template: structuredClone(templates.find((item) => item.id === input.templateId)) };
      rows.set(row.id, row); writes++; return structuredClone(row);
    },
    async update(userId, id, input) {
      if (rows.get(id)?.userId !== userId) throw missing();
      Object.assign(rows.get(id), input, { updatedAt: new Date() }); writes++; return structuredClone(rows.get(id));
    },
    async delete(userId, id) {
      if (rows.get(id)?.userId !== userId) throw missing();
      rows.delete(id); writes++;
    },
  };
  const service = createProjectService(repository, { async findById(id) { return templates.find((row) => row.id === id) ?? null; } });
  const http = await featureFixture(t, (guard) => ({ projectRouter: createProjectRouter(service, guard) }));
  return { ...http, rows, templates, repository, writes: () => writes,
    input: { name: 'My portfolio', slug: 'my-portfolio', templateId: templateSeedData[0].id, repoName: 'my-portfolio' } };
}

test('project CRUD creates independent template defaults, returns safe DTOs, and removes owned records', async (t) => {
  const f = await fixture(t);
  assert.equal((await fetch(f.url + '/projects')).status, 401);
  const response = await f.request('/projects', { method: 'POST', body: JSON.stringify(f.input) });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const project = ProjectSchema.parse((await response.json()).data);
  assert.equal(project.status, 'DRAFT');
  assert.equal(project.sectionCount, 5);
  assert.deepEqual(project.sections.map((section) => section.sortOrder), [0, 1, 2, 3, 4]);
  assert.ok(!('userId' in project));
  f.templates[0].defaultConfig.theme.colors.accent = '#000000';
  assert.equal((await (await f.request('/projects/' + project.id)).json()).data.themeConfig.colors.accent, '#65a30d');
  const patched = await f.request('/projects/' + project.id, { method: 'PATCH', body: JSON.stringify({ name: 'Updated portfolio', status: 'ARCHIVED' }) });
  assert.equal(patched.status, 200);
  assert.equal((await patched.json()).data.name, 'Updated portfolio');
  const list = ProjectPageSchema.parse((await (await f.request('/projects?status=ARCHIVED&pageSize=1')).json()).data);
  assert.equal(list.total, 1);
  assert.equal(list.items.length, 1);
  assert.ok(!('sections' in list.items[0]));
  assert.equal((await f.request('/projects/' + project.id, { method: 'DELETE' })).status, 200);
  assert.equal((await f.request('/projects/' + project.id)).status, 404);
});

test('another user cannot list, read, mutate, or delete an owned project', async (t) => {
  const f = await fixture(t);
  const created = (await (await f.request('/projects', { method: 'POST', body: JSON.stringify(f.input) })).json()).data;
  const headers = { Authorization: `Bearer ${f.otherToken}` };
  assert.equal((await (await f.request('/projects', { headers })).json()).data.total, 0);
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const response = await f.request('/projects/' + created.id, { headers, method,
      ...(method === 'PATCH' ? { body: JSON.stringify({ name: 'Stolen' }) } : {}) });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'PROJECT_NOT_FOUND');
  }
  assert.equal(f.rows.get(created.id).name, f.input.name);
  assert.equal(f.writes(), 1);
});

test('invalid create/update inputs never reach writes, and duplicate slugs use safe conflict errors', async (t) => {
  const f = await fixture(t);
  for (const change of [{ userId: f.otherId }, { name: '<img src=x>' }, { name: ' ' }, { slug: 'Bad Slug' },
    { templateId: 'invalid' }, { status: 'PUBLISHED' }, { themeConfig: {} }, { repoName: '../repo' }]) {
    assert.equal((await f.request('/projects', { method: 'POST', body: JSON.stringify({ ...f.input, ...change }) })).status, 400);
  }
  assert.equal(f.writes(), 0);
  const project = (await (await f.request('/projects', { method: 'POST', body: JSON.stringify(f.input) })).json()).data;
  const duplicate = await f.request('/projects', { method: 'POST', body: JSON.stringify(f.input) });
  assert.equal(duplicate.status, 409);
  const body = await duplicate.json();
  assert.equal(body.error.code, 'PROJECT_SLUG_TAKEN');
  assert.ok(!JSON.stringify(body).includes('private-unique-index-details'));
  for (const input of [{}, { templateId: f.input.templateId }, { userId: f.otherId }, { status: 'PUBLISHED' }]) {
    assert.equal((await f.request('/projects/' + project.id, { method: 'PATCH', body: JSON.stringify(input) })).status, 400);
  }
  assert.equal(f.writes(), 1);
  for (const query of ['pageSize=51', 'page=0', 'status=unknown', 'sort=privateField', 'userId=forged']) {
    assert.equal((await f.request('/projects?' + query)).status, 400);
  }
  assert.equal((await f.request('/projects/not-a-uuid')).status, 400);
  assert.equal((await f.request('/projects', { method: 'POST', body: JSON.stringify({ ...f.input, templateId: randomUUID() }) })).status, 404);
});

test('cookie-authenticated writes require the frontend origin', async (t) => {
  const f = await fixture(t);
  const response = await fetch(f.url + '/projects', { method: 'POST', headers: {
    Cookie: `gitfolio_session=${f.token}`, 'Content-Type': 'application/json',
  }, body: JSON.stringify(f.input) });
  assert.equal(response.status, 403);
  assert.equal(f.writes(), 0);
});

test('Prisma repository applies ownership in every query and creates defaults in one nested write', async () => {
  const calls = [];
  const project = Object.fromEntries(['findMany', 'count', 'findUnique', 'create', 'update', 'delete'].map((operation) => [operation, async (args) => {
    calls.push({ operation, args }); return operation === 'findMany' ? [] : operation === 'count' ? 0 : null;
  }]));
  const repository = createProjectRepository({ project, $transaction: (queries) => Promise.all(queries) });
  const userId = randomUUID(), id = randomUUID();
  await repository.list(userId, { page: 2, pageSize: 5, sort: 'name', status: 'DRAFT', search: 'portfolio' });
  await repository.findById(userId, id);
  await repository.update(userId, id, { name: 'Updated' });
  await repository.delete(userId, id);
  for (const call of calls.filter((item) => ['findUnique', 'update', 'delete'].includes(item.operation))) {
    assert.deepEqual(call.args.where, { id_userId: { id, userId } });
  }
  const listing = calls.find((item) => item.operation === 'findMany');
  assert.equal(listing.args.where.userId, userId);
  assert.equal(listing.args.take, 5);
  assert.equal(listing.args.skip, 5);
  assert.ok(!listing.args.select.user);
  await repository.create(userId, { name: 'Portfolio', slug: 'portfolio', templateId: templateSeedData[0].id }, templateSeedData[0].defaultConfig);
  const created = calls.find((item) => item.operation === 'create');
  assert.equal(created.args.data.userId, userId);
  assert.equal(created.args.data.sections.create.length, 5);
  assert.deepEqual(created.args.data.themeConfig, templateSeedData[0].defaultConfig.theme);
});
