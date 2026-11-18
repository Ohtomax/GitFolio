import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
  await f.page.getByLabel('Section heading', { exact: true }).press('Control+z');
  assert.equal(await f.page.getByLabel('Section heading', { exact: true }).inputValue(), 'Your name');
  await f.page.getByLabel('Section heading', { exact: true }).press('Control+Shift+z');
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

test('live preview renders every section type, validates links, escapes text, and adapts to its pane width', async (t) => {
  const project = projectFixtureData('Preview');
  project.sections[0].content = { heading: 'Your name', description: 'My introduction', buttonLabel: 'Contact me', buttonUrl: 'https://example.com/contact' };
  for (const type of ['about', 'projects', 'skills', 'experience', 'education', 'contact']) {
    project.sections.push({ id: randomUUID(), type, sortOrder: project.sections.length, visible: true,
      content: { heading: `My ${type}`, description: `Details for ${type}`, items: ['projects', 'skills', 'experience', 'education'].includes(type)
        ? [{ title: `${type} entry`, subtitle: 'A subtitle', description: 'Entry details', url: 'https://example.com/work' }] : [] } });
  }
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.getByRole('heading', { name: 'My education', exact: true }).waitFor();
  assert.equal(await preview.locator('section').count(), 7);
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  const link = preview.getByRole('link', { name: 'projects entry', exact: true });
  assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(await link.getAttribute('target'), '_blank');
  await f.page.getByRole('button', { name: 'mobile preview width', exact: true }).click();
  assert.ok((await f.page.getByTestId('preview-viewport').boundingBox()).width <= 375);
  const hostile = '<script>window.portfolioScriptRan=true</script>';
  await f.page.getByLabel('Section heading', { exact: true }).fill(hostile);
  await preview.getByRole('heading', { name: hostile, exact: true }).waitFor();
  assert.equal(await preview.locator('script').count(), 0);
  assert.equal(await f.page.evaluate(() => window.portfolioScriptRan), undefined);
  await f.page.getByLabel('Button link', { exact: true }).fill('javascript:alert(1)');
  assert.equal(await preview.getByRole('link', { name: 'Contact me', exact: true }).count(), 0);
  await f.page.getByLabel('Visible in portfolio', { exact: true }).uncheck();
  await preview.getByRole('heading', { name: hostile, exact: true }).waitFor({ state: 'detached' });
  await f.page.setViewportSize({ width: 320, height: 900 });
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('autosave debounces typing and persists the latest document without a manual save', async (t) => {
  const project = projectFixtureData('Autosave');
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('First draft'); await input.fill('Latest draft');
  await f.page.waitForTimeout(200); assert.equal(f.state.editorSaves, 0);
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(f.state.editorSaves, 1); assert.equal(f.state.projects[0].sections[0].content.heading, 'Latest draft');
  await f.page.reload(); assert.equal(await input.inputValue(), 'Latest draft');
  assert.equal(f.state.editorSaves, 1);
});

test('typing during an in-flight autosave queues a newer snapshot with the acknowledged revision', async (t) => {
  let release;
  const project = projectFixtureData('Queued saves');
  const f = await projectsFixture(t, browser, { projects: [project], waitForEditor: new Promise((resolve) => { release = resolve; }) });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('First snapshot'); await f.page.getByText('Saving…', { exact: true }).waitFor();
  await input.fill('Newer while saving'); await f.page.waitForTimeout(1000);
  assert.equal(f.state.editorSaves, 1);
  release(); await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(await input.inputValue(), 'Newer while saving');
  assert.deepEqual(f.state.editorBodies.map((body) => body.baseRevision), [0, 1]);
  assert.equal(f.state.projects[0].sections[0].content.heading, 'Newer while saving');
});

test('failed autosaves preserve edits, stop automatic retries, and recover with Retry save', async (t) => {
  const project = projectFixtureData('Offline draft');
  const f = await projectsFixture(t, browser, { projects: [project], failEditor: true });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('Keep this draft');
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
  assert.equal(await input.inputValue(), 'Keep this draft');
  await f.page.waitForTimeout(1100); assert.equal(f.state.editorSaves, 1);
  f.state.failEditor = false;
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(f.state.projects[0].sections[0].content.heading, 'Keep this draft');
});

test('a lost acknowledgement cannot silently overwrite the server revision on retry', async (t) => {
  const project = projectFixtureData('Lost response');
  const f = await projectsFixture(t, browser, { projects: [project], loseEditorResponseOnce: true });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('Already committed');
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
  assert.equal(f.state.projects[0].editorRevision, 1);
  await input.fill('New local changes');
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await f.page.getByRole('alert').filter({ hasText: /A newer version was saved elsewhere/ }).waitFor();
  assert.equal(await input.inputValue(), 'New local changes');
  assert.equal(f.state.projects[0].sections[0].content.heading, 'Already committed');
});

test('an auth-service interruption recovers the owner draft and resumes only after checking the server', async (t) => {
  const project = projectFixtureData('Recovered draft');
  const f = await projectsFixture(t, browser, { projects: [project], failEditor: true });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('Recovered content');
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
  f.state.unavailable = true;
  await f.page.evaluate(() => {
    const originalNow = Date.now;
    Date.now = () => originalNow() + 6 * 60 * 1000;
    window.dispatchEvent(new Event('visibilitychange'));
  });
  await f.page.getByRole('heading', { name: 'We couldn’t check your session.', exact: true }).waitFor();
  f.state.unavailable = false;
  await f.page.getByRole('button', { name: 'Try again', exact: true }).click();
  await f.page.getByRole('button', { name: 'Resume draft', exact: true }).waitFor();
  assert.equal(await input.inputValue(), 'Recovered content');
  const attempts = f.state.editorSaves;
  await f.page.waitForTimeout(1000); assert.equal(f.state.editorSaves, attempts);
  f.state.failEditor = false;
  await f.page.getByRole('button', { name: 'Resume draft', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(f.state.projects[0].sections[0].content.heading, 'Recovered content');
  assert.deepEqual(await f.page.evaluate(() => ({ ...localStorage, ...sessionStorage })), {});
});

test('revision conflicts retain local changes until an explicit confirmed reload', async (t) => {
  const project = projectFixtureData('Conflict');
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('My unsaved draft');
  f.state.projects[0].editorRevision++; f.state.projects[0].sections[0].content.heading = 'Saved in another tab';
  await f.page.getByRole('alert').filter({ hasText: /A newer version was saved elsewhere/ }).waitFor();
  assert.equal(await input.inputValue(), 'My unsaved draft');
  assert.equal(await f.page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled(), true);
  await f.page.waitForTimeout(1000); assert.equal(f.state.editorSaves, 1);
  f.page.once('dialog', (dialog) => dialog.dismiss());
  await f.page.getByRole('button', { name: 'Reload saved version', exact: true }).click();
  assert.equal(await input.inputValue(), 'My unsaved draft');
  f.state.failProjects = true;
  f.page.once('dialog', (dialog) => dialog.accept());
  await f.page.getByRole('button', { name: 'Reload saved version', exact: true }).click();
  await f.page.getByText('The request could not be completed. Please try again.', { exact: true }).waitFor();
  assert.equal(await f.page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled(), true);
  assert.equal(await f.page.getByText('Save paused', { exact: true }).count(), 1);
  f.state.failProjects = false;
  f.page.once('dialog', (dialog) => dialog.accept());
  await f.page.getByRole('button', { name: 'Reload saved version', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  assert.equal(await input.inputValue(), 'Saved in another tab');
});

test('unsaved navigation and sign-out require a user choice, including browser history navigation', async (t) => {
  const project = projectFixtureData('Navigation');
  const f = await projectsFixture(t, browser, { projects: [project], failEditor: true });
  await f.goto('/dashboard');
  await f.page.getByRole('link', { name: 'Edit Navigation', exact: true }).click();
  const input = f.page.getByLabel('Section heading', { exact: true });
  await input.fill('Do not lose this');
  await f.page.getByRole('button', { name: 'Retry save', exact: true }).waitFor();
  await f.page.getByRole('link', { name: 'All projects', exact: true }).click();
  await f.page.getByRole('button', { name: 'Stay here', exact: true }).click();
  assert.equal(await input.inputValue(), 'Do not lose this');
  f.page.once('dialog', (dialog) => dialog.dismiss());
  await f.page.getByRole('button', { name: 'Sign out', exact: true }).click();
  assert.equal(f.state.authenticated, true);
  await f.page.evaluate(() => history.back());
  await f.page.getByRole('button', { name: 'Leave editor', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  await f.page.getByRole('link', { name: 'Edit Navigation', exact: true }).click();
  assert.equal(await input.inputValue(), 'Your name');
});

test('archived editor documents remain read-only and do not autosave', async (t) => {
  const project = { ...projectFixtureData('Archived'), status: 'ARCHIVED' };
  const f = await projectsFixture(t, browser, { projects: [project] });
  await f.goto(`/projects/${project.id}/edit`);
  await f.page.getByText(/This project is archived/).waitFor();
  assert.equal(await f.page.getByLabel('Section heading', { exact: true }).isDisabled(), true);
  assert.equal(await f.page.getByRole('button', { name: 'Add section', exact: true }).isDisabled(), true);
  await f.page.waitForTimeout(1000); assert.equal(f.state.editorSaves, 0);
});
