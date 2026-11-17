import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { projectFixtureData, projectsFixture, templateFixtures } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('dashboard shows a loading skeleton, then an actionable empty state', async (t) => {
  let release;
  const waitForProjects = new Promise((resolve) => { release = resolve; });
  const f = await projectsFixture(t, browser, { waitForProjects });
  await f.goto('/dashboard');
  await f.page.getByRole('status', { name: 'Loading projects' }).waitFor();
  release();
  await f.page.getByRole('heading', { name: 'Your next idea starts here.' }).waitFor();
  assert.equal(await f.page.getByRole('link', { name: 'Create your first project' }).getAttribute('href'), '/projects/new');
});

test('dashboard edits, archives, restores, and confirms deletion through the project API', async (t) => {
  const f = await projectsFixture(t, browser, { projects: [projectFixtureData('Alpha')] });
  await f.goto('/dashboard');
  await f.page.getByRole('button', { name: 'Manage Alpha', exact: true }).click();
  const dialog = f.page.getByRole('dialog', { name: 'Manage project' });
  await dialog.getByLabel('Project name', { exact: true }).fill('Renamed Alpha');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await f.page.getByRole('heading', { name: 'Renamed Alpha', exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Manage Renamed Alpha', exact: true }).click();
  await dialog.getByRole('button', { name: 'Archive project', exact: true }).click();
  await f.page.getByRole('button', { name: 'Archived', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Renamed Alpha', exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Manage Renamed Alpha', exact: true }).click();
  await dialog.getByRole('button', { name: 'Restore project', exact: true }).click();
  await f.page.getByRole('heading', { name: 'No projects found.' }).waitFor();
  await f.page.getByRole('button', { name: 'Clear filters' }).click();
  await f.page.getByRole('button', { name: 'Manage Renamed Alpha', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete project', exact: true }).click();
  await dialog.getByRole('button', { name: 'Keep project', exact: true }).click();
  assert.equal(f.state.projects.length, 1);
  await dialog.getByRole('button', { name: 'Delete project', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Your next idea starts here.' }).waitFor();
  assert.equal(f.state.projects.length, 0);
});

test('dashboard paginates and searches on the server and recovers from an API error', async (t) => {
  const f = await projectsFixture(t, browser, { projects: Array.from({ length: 8 }, (_, index) => projectFixtureData(`Project ${String(index + 1).padStart(2, '0')}`, index)), failProjects: true });
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'Your projects couldn’t load.' }).waitFor();
  f.state.failProjects = false;
  await f.page.getByRole('button', { name: 'Try again' }).click();
  await f.page.getByLabel('Sort projects').selectOption('name');
  await f.page.getByText('Page 1 of 2', { exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Next', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Project 08', exact: true }).waitFor();
  await f.page.getByRole('searchbox', { name: 'Search projects', exact: true }).fill('Project 03');
  await f.page.getByRole('button', { name: 'Search projects', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Project 03', exact: true }).waitFor();
  assert.equal(await f.page.locator('article').count(), 1);
});

test('dashboard fits mobile and settings dialogs stay within the viewport', async (t) => {
  const f = await projectsFixture(t, browser, { projects: [projectFixtureData('Mobile portfolio')], viewport: { width: 320, height: 900 } });
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'Mobile portfolio', exact: true }).waitFor();
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await f.page.getByRole('button', { name: 'Manage Mobile portfolio', exact: true }).click();
  await f.page.getByLabel('Project name', { exact: true }).waitFor();
  const box = await f.page.getByRole('dialog').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 320);
});

test('dashboard keeps private content behind AuthGuard and renders the desktop project list', async (t) => {
  const anonymous = await projectsFixture(t, browser, { authenticated: false });
  await anonymous.goto('/dashboard');
  await anonymous.page.waitForURL('**/login');
  assert.equal(anonymous.state.projectRequests, 0);
  const f = await projectsFixture(t, browser, { projects: [projectFixtureData('Personal portfolio'), projectFixtureData('Selected projects', 1), projectFixtureData('My story', 2)] });
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'Personal portfolio', exact: true }).waitFor();
  await f.page.screenshot({ path: fileURLToPath(new URL('../../../.local/phase3-dashboard.png', import.meta.url)), fullPage: true });
});

test('new project filters templates, preserves custom slugs, creates once, and survives dashboard reload', async (t) => {
  const f = await projectsFixture(t, browser);
  await f.goto('/dashboard');
  await f.page.getByRole('link', { name: 'Create your first project' }).click();
  await f.page.waitForURL('**/projects/new');
  assert.equal(await f.page.getByRole('button', { name: 'Continue', exact: true }).isEnabled(), false);
  await f.page.getByRole('button', { name: 'Developer', exact: true }).click();
  await f.page.getByRole('radio', { name: /Terminal/ }).waitFor();
  assert.equal(await f.page.getByRole('radio').count(), 1);
  await f.page.getByText('Terminal', { exact: true }).click();
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByLabel('Project name', { exact: true }).fill('My Résumé');
  assert.equal(await f.page.getByLabel('Project slug', { exact: true }).inputValue(), 'my-resume');
  await f.page.getByLabel('Project slug', { exact: true }).fill('my-custom-slug');
  await f.page.getByLabel('Project name', { exact: true }).fill('Updated portfolio');
  assert.equal(await f.page.getByLabel('Project slug', { exact: true }).inputValue(), 'my-custom-slug');
  await f.page.getByLabel('Repository name (optional)', { exact: true }).fill('my-repo');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  await f.page.getByRole('heading', { name: 'Updated portfolio', exact: true }).waitFor();
  assert.equal(f.state.creates, 1);
  assert.equal(f.state.projects[0].templateId, templateFixtures[1].id);
  assert.equal(f.state.projects[0].repoName, 'my-repo');
  await f.page.reload();
  await f.page.getByRole('heading', { name: 'Updated portfolio', exact: true }).waitFor();
});

test('project setup validates locally and preserves input while recovering from a duplicate slug', async (t) => {
  const f = await projectsFixture(t, browser, { rejectCreate: true });
  await f.goto('/projects/new');
  await f.page.getByText('Canvas', { exact: true }).click();
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.getByText('Enter a project name.', { exact: true }).waitFor();
  assert.equal(f.state.creates, 0);
  await f.page.getByLabel('Project name', { exact: true }).fill('Fresh portfolio');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.getByRole('alert').getByText(/already have a project with this slug/).waitFor();
  assert.equal(await f.page.getByLabel('Project name', { exact: true }).inputValue(), 'Fresh portfolio');
  f.state.rejectCreate = false;
  await f.page.getByLabel('Project slug', { exact: true }).fill('fresh-copy');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  await f.page.getByRole('heading', { name: 'Fresh portfolio', exact: true }).waitFor();
  assert.equal(f.state.creates, 2);
  assert.equal(f.state.projects[0].slug, 'fresh-copy');
});

test('template catalog outages and empty results are recoverable', async (t) => {
  const f = await projectsFixture(t, browser, { failTemplates: true });
  await f.goto('/projects/new');
  await f.page.getByRole('heading', { name: 'Templates couldn’t load.' }).waitFor();
  assert.equal(await f.page.getByRole('button', { name: 'Continue', exact: true }).isEnabled(), false);
  f.state.failTemplates = false;
  await f.page.getByRole('button', { name: 'Try again' }).click();
  await f.page.getByRole('radio', { name: /Canvas/ }).waitFor();
  const empty = await projectsFixture(t, browser, { templates: [] });
  await empty.goto('/projects/new');
  await empty.page.getByRole('heading', { name: 'No templates found.' }).waitFor();
  assert.equal(await empty.page.getByRole('button', { name: 'Continue', exact: true }).isEnabled(), false);
});

test('selected template defaults must load before creating a project', async (t) => {
  const f = await projectsFixture(t, browser, { failTemplateDetail: true });
  await f.goto('/projects/new');
  await f.page.getByText('Canvas', { exact: true }).click();
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Your template couldn’t load.' }).waitFor();
  assert.equal(await f.page.getByRole('button', { name: 'Create project', exact: true }).isEnabled(), false);
  f.state.failTemplateDetail = false;
  await f.page.getByRole('button', { name: 'Retry template' }).click();
  await f.page.getByRole('heading', { name: 'Canvas', exact: true }).waitFor();
  await f.page.getByLabel('Project name', { exact: true }).fill('Recovered project');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
});

test('template pagination and keyboard selection work on the new project page', async (t) => {
  const f = await projectsFixture(t, browser, { templates: [...templateFixtures, {
    ...templateFixtures[0], id: '10000000-0000-4000-8000-000000000005', name: 'Extra template',
  }] });
  await f.goto('/projects/new');
  await f.page.getByRole('button', { name: 'Next templates', exact: true }).click();
  const radio = f.page.getByRole('radio', { name: /Extra template/ });
  await radio.focus();
  await radio.press('Space');
  assert.equal(await radio.isChecked(), true);
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Extra template', exact: true }).waitFor();
});

test('new project stays guarded and both setup steps fit small screens', async (t) => {
  const anonymous = await projectsFixture(t, browser, { authenticated: false });
  await anonymous.goto('/projects/new');
  await anonymous.page.waitForURL('**/login');
  assert.equal(anonymous.state.templateRequests, 0);
  const f = await projectsFixture(t, browser);
  await f.goto('/projects/new');
  await f.page.getByRole('radio', { name: /Canvas/ }).waitFor();
  await f.page.screenshot({ path: fileURLToPath(new URL('../../../.local/phase3-templates.png', import.meta.url)), fullPage: true });
  await f.page.setViewportSize({ width: 320, height: 900 });
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await f.page.getByText('Canvas', { exact: true }).click();
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByLabel('Project name', { exact: true }).waitFor();
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
