import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export const templateFixtures = ['Canvas', 'Terminal', 'Editorial', 'Studio'].map((name, index) => ({
  id: `10000000-0000-4000-8000-00000000000${index + 1}`, name, description: `A ${name.toLowerCase()} starting point for your work.`,
  category: ['minimal', 'developer', 'professional', 'creative'][index], thumbnailUrl: null, isReact: index === 1,
  defaultConfig: { theme: { colors: { accent: '#65a30d', background: '#fafaf9', text: '#1c1917' }, font: 'sans', spacing: 'spacious' },
    sections: [{ type: 'hero', content: { heading: 'Your name', description: '' }, visible: true }] },
}));
export function projectFixtureData(name = 'Alpha', index = 0) {
  const template = templateFixtures[index % templateFixtures.length];
  return { id: randomUUID(), templateId: template.id, template, name, slug: name.toLowerCase().replaceAll(' ', '-'),
    repoName: null, status: 'DRAFT', editorRevision: 0, sectionCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    themeConfig: structuredClone(template.defaultConfig.theme),
    sections: [{ id: randomUUID(), type: 'hero', sortOrder: 0, content: { heading: 'Your name', description: '' }, visible: true }] };
}
export async function projectsFixture(t, browser, options = {}) {
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(async () => {
    await context.close();
    if (options.expectedPageError) {
      assert.ok(errors.length > 0, 'the injected failure was exercised');
      for (const error of errors) assert.match(error, options.expectedPageError);
    } else assert.deepEqual(errors, []);
  });
  const state = { projects: options.projects ?? [], authenticated: true, failProjects: false, failTemplates: false,
    rejectCreate: false, creates: 0, editorSaves: 0, editorBodies: [], projectRequests: 0, templateRequests: 0, templates: templateFixtures, ...options };
  const session = { user: { id: randomUUID(), githubId: '123', login: 'fixture-user', name: 'Fixture Developer',
    email: null, avatarUrl: null }, expiresAt: Date.now() + 3600000 };
  const respond = (route, status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  const ok = (route, data, status = 200) => respond(route, status, { success: true, data });
  const fail = (route, code, status) => respond(route, status, { success: false, error: { code, message: 'Fixture request failed.' } });
  await page.route('**/api/auth/me', (route) => state.unavailable ? fail(route, 'SERVICE_UNAVAILABLE', 503)
    : state.authenticated ? ok(route, session) : fail(route, 'UNAUTHENTICATED', 401));
  await page.route('**/api/auth/logout', (route) => { state.authenticated = false; return ok(route, null); });
  await page.route('**/api/templates**', (route) => {
    state.templateRequests++;
    if (state.failTemplates) return fail(route, 'TEMPLATES_UNAVAILABLE', 503);
    const url = new URL(route.request().url());
    const id = url.pathname.split('/')[3];
    if (id && state.failTemplateDetail) return fail(route, 'TEMPLATES_UNAVAILABLE', 503);
    if (id) { const template = state.templates.find((item) => item.id === id); return template ? ok(route, template) : fail(route, 'TEMPLATE_NOT_FOUND', 404); }
    const category = url.searchParams.get('category');
    const filtered = state.templates.filter((item) => !category || item.category === category);
    const pageNumber = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 12);
    return ok(route, { items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), total: filtered.length,
      page: pageNumber, pageSize, totalPages: Math.ceil(filtered.length / pageSize) });
  });
  await page.route('**/api/projects**', async (route) => {
    state.projectRequests++;
    if (state.waitForProjects) await state.waitForProjects;
    if (state.failProjects) return fail(route, 'SERVICE_UNAVAILABLE', 503);
    const url = new URL(route.request().url());
    const id = url.pathname.split('/')[3];
    const method = route.request().method();
    if (!id && method === 'POST') {
      state.creates++;
      const input = route.request().postDataJSON();
      if (state.rejectCreate || state.projects.some((item) => item.slug === input.slug)) return fail(route, 'PROJECT_SLUG_TAKEN', 409);
      const selected = state.templates.find((item) => item.id === input.templateId);
      if (!selected) return fail(route, 'TEMPLATE_NOT_FOUND', 404);
      const project = { ...projectFixtureData(input.name), ...input, template: selected, templateId: selected.id,
        repoName: input.repoName ?? null, themeConfig: structuredClone(selected.defaultConfig.theme),
        sectionCount: selected.defaultConfig.sections.length,
        sections: selected.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
      state.projects.unshift(project); return ok(route, project, 201);
    }
    if (id) {
      const index = state.projects.findIndex((item) => item.id === id);
      if (index < 0) return fail(route, 'PROJECT_NOT_FOUND', 404);
      if (url.pathname.endsWith('/editor') && method === 'PATCH') {
        state.editorSaves++;
        const input = route.request().postDataJSON();
        state.editorBodies.push(input);
        if (state.failEditor) return fail(route, 'SERVICE_UNAVAILABLE', 503);
        if (state.projects[index].status === 'ARCHIVED') return fail(route, 'PROJECT_ARCHIVED', 409);
        if (input.baseRevision !== state.projects[index].editorRevision) return fail(route, 'EDITOR_CONFLICT', 409);
        if (state.waitForEditor) await state.waitForEditor;
        Object.assign(state.projects[index], { themeConfig: input.themeConfig,
          sections: input.sections.map((section, sortOrder) => ({ ...section, sortOrder })),
          sectionCount: input.sections.length, editorRevision: input.baseRevision + 1, updatedAt: new Date().toISOString() });
        if (state.loseEditorResponseOnce) { state.loseEditorResponseOnce = false; return route.abort('failed'); }
        return ok(route, state.projects[index]);
      }
      if (method === 'DELETE') { state.projects.splice(index, 1); return ok(route, null); }
      if (method === 'PATCH') Object.assign(state.projects[index], route.request().postDataJSON(), { updatedAt: new Date().toISOString() });
      return ok(route, state.projects[index]);
    }
    const status = url.searchParams.get('status'), search = url.searchParams.get('search')?.toLowerCase();
    const filtered = state.projects.filter((item) => (!status || item.status === status) && (!search || item.name.toLowerCase().includes(search)));
    filtered.sort((a, b) => url.searchParams.get('sort') === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt));
    const pageNumber = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 12);
    return ok(route, { items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize).map(({ themeConfig, sections, ...item }) => ({ ...item, preview: themeConfig })),
      total: filtered.length, page: pageNumber, pageSize, totalPages: Math.ceil(filtered.length / pageSize) });
  });
  const baseUrl = process.env.GITFOLIO_BROWSER_BASE_URL ?? 'http://127.0.0.1:5173';
  return { page, context, state, session, goto: (path) => page.goto(new URL(path, baseUrl).href) };
}
