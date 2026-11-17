import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { ProjectSchema, SaveEditorSchema } from '@gitfolio/shared';
import { createProjectRepository } from '../dist/modules/project/project.repository.js';
import { createProjectService } from '../dist/modules/project/project.service.js';
import { createProjectRouter } from '../dist/modules/project/project.route.js';
import { templateSeedData } from '../dist/modules/template/template.seed.js';
import { featureFixture } from './helpers/features.mjs';

async function fixture(t, status = 'DRAFT') {
  const id = randomUUID(), foreignId = randomUUID();
  let row, sections;
  function detail() { return { ...structuredClone(row), _count: { sections: sections.filter((section) => section.projectId === id).length },
    sections: sections.filter((section) => section.projectId === id).sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ projectId, ...section }) => structuredClone(section)) }; }
  const f = await featureFixture(t, (guard, ownerId) => {
    row = { id, userId: ownerId, name: 'Editor fixture', slug: 'editor-fixture', repoName: null,
      templateId: templateSeedData[0].id, template: templateSeedData[0], status, editorRevision: 0,
      themeConfig: structuredClone(templateSeedData[0].defaultConfig.theme), createdAt: new Date(), updatedAt: new Date() };
    sections = [{ id: randomUUID(), projectId: id, type: 'hero', visible: true, sortOrder: 0,
      content: { heading: 'Original', description: '' } }, { id: foreignId, projectId: randomUUID(), type: 'about', visible: true, sortOrder: 0, content: { heading: 'Foreign', description: '' } }];
    const owns = (where) => where.id_userId?.id === id && where.id_userId?.userId === ownerId;
    const transaction = {
      project: {
        async updateMany({ where }) {
          if (where.id !== id || where.userId !== ownerId || where.editorRevision !== row.editorRevision || row.status === 'ARCHIVED') return { count: 0 };
          row.editorRevision++; return { count: 1 };
        },
        async findUnique({ where }) { return owns(where) ? detail() : null; },
        async update({ where, data }) { assert.ok(owns(where)); Object.assign(row, data); return detail(); },
      },
      section: {
        async findMany({ where }) { return sections.filter((section) => where.id.in.includes(section.id)).map(({ id, projectId }) => ({ id, projectId })); },
        async deleteMany({ where }) { sections = sections.filter((section) => section.projectId !== where.projectId || where.id?.notIn.includes(section.id)); },
        async updateMany({ where, data }) { assert.equal(where.projectId, id); Object.assign(sections.find((section) => section.id === where.id && section.projectId === where.projectId), data); },
        async create({ data }) { sections.push(structuredClone(data)); return { id: data.id }; },
      },
    };
    const database = { ...transaction, async $transaction(action) {
      const before = { row: structuredClone(row), sections: structuredClone(sections) };
      try { return await action(transaction); } catch (error) { row = before.row; sections = before.sections; throw error; }
    } };
    const service = createProjectService(createProjectRepository(database), { async findById() { return null; } });
    return { projectRouter: createProjectRouter(service, guard) };
  });
  const input = () => ({ baseRevision: row.editorRevision, themeConfig: structuredClone(row.themeConfig),
    sections: detail().sections.map(({ sortOrder, ...section }) => section) });
  return { ...f, id, foreignId, input, row: () => row, sections: () => sections,
    save: (input, options = {}) => f.request(`/projects/${id}/editor`, { method: 'PATCH', body: JSON.stringify(input), ...options }) };
}

test('editor save atomically applies ordered content/theme and rejects a stale revision', async (t) => {
  const f = await fixture(t);
  const input = f.input();
  input.sections.unshift({ id: randomUUID(), type: 'projects', visible: false,
    content: { heading: 'Work', description: '', items: [{ title: 'Project one', url: 'https://example.com/work' }] } });
  input.sections[1].content.heading = 'Updated hero';
  input.themeConfig.colors.accent = '#112233';
  const response = await f.save(input);
  assert.equal(response.status, 200);
  const saved = ProjectSchema.parse((await response.json()).data);
  assert.equal(saved.editorRevision, 1);
  assert.deepEqual(saved.sections.map((section) => section.sortOrder), [0, 1]);
  assert.equal(saved.themeConfig.colors.accent, '#112233');
  const stale = await f.save(input);
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).error.code, 'EDITOR_CONFLICT');
  assert.equal(f.row().editorRevision, 1);
  assert.equal((await f.save({ baseRevision: 1, themeConfig: input.themeConfig, sections: [] })).status, 200);
  assert.equal(f.sections().filter((section) => section.projectId === f.id).length, 0);
});

test('editor cannot write another owner’s project or reparent another project’s section', async (t) => {
  const f = await fixture(t);
  const unauthorized = await f.save(f.input(), { headers: { Authorization: `Bearer ${f.otherToken}` } });
  assert.equal(unauthorized.status, 404);
  const input = f.input(); input.sections[0].id = f.foreignId;
  assert.equal((await f.save(input)).status, 400);
  assert.equal(f.row().editorRevision, 0);
  assert.equal(f.sections().find((section) => section.id === f.foreignId).content.heading, 'Foreign');
});

test('editor input rejects duplicate IDs, unsafe links, overposting, and oversized collections before writes', async (t) => {
  const f = await fixture(t);
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:pass@example.com']) {
    const input = f.input(); input.sections[0].content.buttonUrl = url;
    assert.equal((await f.save(input)).status, 400);
  }
  for (const change of [{ userId: f.otherId }, { baseRevision: '0' }, { themeConfig: { colors: { accent: 'red' } } },
    { sections: Array(51).fill(f.input().sections[0]) }, { sections: [f.input().sections[0], f.input().sections[0]] }]) {
    assert.equal((await f.save({ ...f.input(), ...change })).status, 400);
  }
  assert.equal(f.row().editorRevision, 0);
  assert.equal(SaveEditorSchema.safeParse({ ...f.input(), sections: [{ ...f.input().sections[0], content: { heading: 'Safe text', description: '', buttonUrl: 'mailto:hello@example.com' } }] }).success, true);
});

test('archived documents and cookie writes without Origin are blocked', async (t) => {
  const archived = await fixture(t, 'ARCHIVED');
  assert.equal((await archived.save(archived.input())).status, 409);
  assert.equal(archived.row().editorRevision, 0);
  const f = await fixture(t);
  const response = await fetch(`${f.url}/projects/${f.id}/editor`, { method: 'PATCH',
    headers: { Cookie: `gitfolio_session=${f.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(f.input()) });
  assert.equal(response.status, 403);
});
