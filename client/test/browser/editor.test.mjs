import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('dashboard opens the protected editor with its canvas and side panels', async (t) => {
  const project = projectFixtureData('Editor portfolio');
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto('/dashboard');
  await f.page.getByRole('link', { name: 'Edit Editor portfolio', exact: true }).click();
  await f.page.waitForURL(`**/projects/${project.id}/edit`);
  await f.page.getByRole('heading', { name: 'Editor portfolio', exact: true }).waitFor();
  await f.page.getByRole('complementary', { name: 'Editor navigation' }).waitFor();
  await f.page.getByRole('complementary', { name: 'Editor properties' }).waitFor();
  await f.page.setViewportSize({ width: 320, height: 900 });
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('editor routes reject invalid links and remain behind authentication', async (t) => {
  const anonymous = await projectsFixture(t, browser, { authenticated: false });
  await anonymous.goto('/projects/11111111-1111-4111-8111-111111111111/edit');
  await anonymous.page.waitForURL('**/login');
  assert.equal(anonymous.state.projectRequests, 0);
  const f = await projectsFixture(t, browser);
  await f.goto('/projects/invalid/edit');
  await f.page.getByRole('heading', { name: 'This project link is invalid.' }).waitFor();
  assert.equal(f.state.projectRequests, 0);
});
