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

test('sections can be added edited reordered hidden removed restored and saved', async (t) => {
  const project = projectFixtureData('Sections');
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  await f.page.getByLabel('Section heading', { exact: true }).fill('A better introduction');
  await f.page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await f.page.getByLabel('Section heading', { exact: true }).inputValue(), 'Your name');
  await f.page.getByRole('button', { name: 'Redo', exact: true }).click();
  await f.page.getByLabel('Add a section', { exact: true }).selectOption('projects');
  await f.page.getByRole('button', { name: 'Add section', exact: true }).click();
  await f.page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await f.page.getByLabel('Entry 1 title', { exact: true }).fill('My first project');
  await f.page.getByLabel('Entry 1 link', { exact: true }).fill('https://example.com/project');
  await f.page.getByRole('button', { name: 'Move section 2 up', exact: true }).click();
  await f.page.getByLabel('Visible in portfolio', { exact: true }).uncheck();
  await f.page.getByRole('button', { name: 'Remove section', exact: true }).click();
  await f.page.getByRole('button', { name: 'Undo', exact: true }).click();
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(f.state.projects[0].sections.length, 2);
  assert.equal(f.state.projects[0].sections[0].type, 'projects');
  assert.equal(f.state.projects[0].sections[0].visible, false);
  assert.equal(f.state.projects[0].sections[0].content.items[0].title, 'My first project');
  await f.page.reload();
  await f.page.getByLabel('Section heading', { exact: true }).waitFor();
  assert.equal(await f.page.getByLabel('Section heading', { exact: true }).inputValue(), 'Projects');
});

test('theme controls update colors fonts and spacing, support undo, and persist across reload', async (t) => {
  const project = projectFixtureData('Theme');
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  await f.page.getByRole('button', { name: /^theme$/i }).click();
  await f.page.getByLabel('Background color', { exact: true }).evaluate((input) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '#123456');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await f.page.getByLabel('Font family', { exact: true }).selectOption('serif');
  await f.page.getByLabel('Section spacing', { exact: true }).selectOption('compact');
  await f.page.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await f.page.getByLabel('Section spacing', { exact: true }).inputValue(), 'spacious');
  await f.page.getByRole('button', { name: 'Redo', exact: true }).click();
  const preview = f.page.getByRole('region', { name: 'Theme preview', exact: true });
  assert.equal(await preview.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(18, 52, 86)');
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await f.page.getByRole('button', { name: /^theme$/i }).click();
  assert.equal(await f.page.getByLabel('Font family', { exact: true }).inputValue(), 'serif');
  assert.equal(await f.page.getByLabel('Section spacing', { exact: true }).inputValue(), 'compact');
  assert.equal(await f.page.getByLabel('Background color', { exact: true }).inputValue(), '#123456');
  await f.page.getByRole('button', { name: 'Use template defaults', exact: true }).click();
  assert.equal(await f.page.getByLabel('Font family', { exact: true }).inputValue(), 'sans');
});
