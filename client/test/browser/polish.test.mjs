import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('a failed route download shows safe recovery and reloads the latest page', async (t) => {
  const f = await projectsFixture(t, browser, { expectedPageError: /Failed to fetch dynamically imported module: .*DashboardPage-/ });
  let failChunk = true;
  await f.page.route('**/assets/DashboardPage-*.js', (route) => failChunk ? route.abort('failed') : route.continue());
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'This page couldn’t load.' }).waitFor();
  assert.ok(!(await f.page.locator('body').innerText()).includes('TypeError'));
  failChunk = false;
  await f.page.getByRole('button', { name: 'Reload page', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Your projects.' }).waitFor();
});

test('a broken canvas stays inside the preview and can recover without discarding editor changes', async (t) => {
  const template = BUILTIN_TEMPLATES.find((item) => item.defaultConfig.theme.layout === 'frontend');
  const project = { ...projectFixtureData('Preview recovery'), templateId: template.id, template,
    themeConfig: structuredClone(template.defaultConfig.theme), sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
  project.sectionCount = project.sections.length;
  const f = await projectsFixture(t, browser, { projects: [project], expectedPageError: /^private-render-diagnostic$/ });
  await f.page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    window.restoreCanvas = () => { HTMLCanvasElement.prototype.getContext = getContext; };
    HTMLCanvasElement.prototype.getContext = () => { throw new Error('private-render-diagnostic'); };
  });
  await f.goto(`/projects/${project.id}/edit`);
  await f.page.getByRole('heading', { name: 'The preview couldn’t render.' }).waitFor();
  await f.page.getByLabel('Section heading', { exact: true }).fill('My work survived the preview crash');
  assert.ok(!(await f.page.locator('body').innerText()).includes('private-render-diagnostic'));
  await f.page.evaluate(() => window.restoreCanvas());
  await f.page.getByRole('button', { name: 'Try preview again' }).click();
  await f.page.getByRole('region', { name: 'Portfolio preview', exact: true }).getByRole('heading', { name: 'My work survived the preview crash' }).waitFor();
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
});
