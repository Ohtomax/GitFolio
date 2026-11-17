import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { TemplateConfigSchema, TemplatePageSchema } from '@gitfolio/shared';
import { templateSeedData, legacyTemplateSeedData, seedTemplates } from '../dist/modules/template/template.seed.js';
import { createTemplateService } from '../dist/modules/template/template.service.js';
import { createTemplateRouter } from '../dist/modules/template/template.route.js';
import { featureFixture } from './helpers/features.mjs';

test('catalog seeds valid defaults, uses stable IDs, and preserves existing rows on repeat runs', async () => {
  const rows = new Map();
  const database = { template: { async findMany({ where }) { return [...rows.values()].filter((row) => where.id.in.includes(row.id)); }, async updateMany({ where, data }) {
    const row = rows.get(where.id);
    const matches = row && Object.entries(where).every(([key, value]) => key === 'defaultConfig'
      ? JSON.stringify(row[key]) === JSON.stringify(value.equals) : row[key] === value);
    if (matches) rows.set(row.id, { ...row, ...structuredClone(data) });
    return { count: Number(Boolean(matches)) };
  }, async createMany({ data, skipDuplicates }) {
    assert.equal(skipDuplicates, true);
    let count = 0;
    for (const item of data) {
      TemplateConfigSchema.parse(item.defaultConfig);
      assert.ok(item.defaultConfig.sections.length > 0);
      if (!rows.has(item.id)) { rows.set(item.id, structuredClone(item)); count++; }
    }
    return { count };
  } } };
  assert.equal((await seedTemplates(database)).count, templateSeedData.length);
  rows.get(templateSeedData[0].id).name = 'Preserved catalog edit';
  assert.equal((await seedTemplates(database)).count, 0);
  assert.equal(rows.get(templateSeedData[0].id).name, 'Preserved catalog edit');
  assert.equal(new Set(templateSeedData.map((row) => row.id)).size, templateSeedData.length);
  for (const row of legacyTemplateSeedData) rows.set(row.id, structuredClone(row));
  rows.get(legacyTemplateSeedData[1].id).defaultConfig.sections[0].content.heading = 'A custom catalog identity';
  const result = await seedTemplates(database);
  assert.equal(result.count, 1);
  assert.equal(rows.get(templateSeedData[0].id).name, templateSeedData[0].name);
  assert.equal(rows.get(legacyTemplateSeedData[1].id).defaultConfig.sections[0].content.heading, 'A custom catalog identity');
  assert.equal(rows.get('20000000-0000-4000-8000-000000000002').defaultConfig.theme.layout, 'terminal');
  assert.equal((await seedTemplates(database)).count, 0);
});

test('template endpoints require a real session, validate queries, and return bounded public metadata', async (t) => {
  let calls = 0;
  let received;
  const service = createTemplateService({ async list(query) {
    calls++; received = query;
    return { items: templateSeedData, total: templateSeedData.length };
  }, async findById(id) { return templateSeedData.find((row) => row.id === id) ?? null; } });
  const f = await featureFixture(t, (guard) => ({ templateRouter: createTemplateRouter(service, guard) }));
  assert.equal((await fetch(f.url + '/templates')).status, 401);
  const response = await f.request('/templates?page=1&pageSize=12&category=minimal');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  TemplatePageSchema.parse(body.data);
  assert.deepEqual(received, { page: 1, pageSize: 12, category: 'minimal' });
  assert.ok(!JSON.stringify(body).includes('defaultConfig'));
  for (const query of ['page=0', 'pageSize=51', 'category=unknown', 'userId=forged', 'page=1&page=2']) {
    assert.equal((await f.request('/templates?' + query)).status, 400);
  }
  assert.equal(calls, 1);
  const detail = await f.request('/templates/' + templateSeedData[0].id);
  assert.equal(detail.status, 200);
  TemplateConfigSchema.parse((await detail.json()).data.defaultConfig);
  assert.equal((await f.request('/templates/not-a-uuid')).status, 400);
  assert.equal((await f.request('/templates/' + randomUUID())).status, 404);
});

test('invalid saved template defaults are reported as unavailable without leaking data', async (t) => {
  const service = createTemplateService({ async list() { throw new Error('private-database-details'); },
    async findById() { return { ...templateSeedData[0], defaultConfig: { private: 'private-config' } }; } });
  const f = await featureFixture(t, (guard) => ({ templateRouter: createTemplateRouter(service, guard) }));
  const invalid = await f.request('/templates/' + templateSeedData[0].id);
  assert.equal(invalid.status, 503);
  assert.equal((await invalid.json()).error.code, 'TEMPLATES_UNAVAILABLE');
  const failed = await f.request('/templates');
  assert.equal(failed.status, 500);
  assert.ok(!(await failed.text()).includes('private-database-details'));
});
