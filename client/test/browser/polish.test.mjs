import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';
import { advanceDeployment, deploymentFixtureData, deploymentsFixture } from './helpers/deployments.mjs';

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

test('project notifications follow async results and survive navigation', async (t) => {
  const f = await projectsFixture(t, browser, { rejectCreate: true });
  await f.goto('/projects/new');
  await f.page.getByText('Canvas', { exact: true }).click();
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByLabel('Project name', { exact: true }).fill('Notification check');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  const toasts = f.page.locator('[data-sonner-toast]');
  await toasts.filter({ hasText: 'You already have a project with this slug.' }).waitFor();
  assert.ok(!(await toasts.innerText()).includes('Fixture request failed'));
  f.state.rejectCreate = false;
  await f.page.getByLabel('Project slug', { exact: true }).fill('notification-check-copy');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  await toasts.filter({ hasText: 'Project created.' }).waitFor();
  await f.page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await f.page.waitForURL('**/login');
  await f.page.waitForFunction(() => !document.querySelector('[data-sonner-toast]:not([data-removed="true"])'));
});

test('deployment completion is announced once; opening old history stays quiet', async (t) => {
  const project = projectFixtureData('Toast deployment'), deployment = deploymentFixtureData(project, 'DEPLOYING');
  const f = await deploymentsFixture(t, browser, { projects: [project], deployments: [deployment] });
  await f.goto(`/projects/${project.id}/deployments`);
  await f.page.getByRole('heading', { name: 'Saved version 1', exact: true }).waitFor();
  assert.equal(await f.page.locator('[data-sonner-toast]').count(), 0);
  advanceDeployment(deployment, 'LIVE');
  await f.page.locator('[data-sonner-toast]').filter({ hasText: 'Your portfolio is live.' }).waitFor();
  await f.page.reload();
  await f.page.getByRole('link', { name: 'Open portfolio', exact: true }).waitFor();
  assert.equal(await f.page.locator('[data-sonner-toast]').count(), 0);
});
