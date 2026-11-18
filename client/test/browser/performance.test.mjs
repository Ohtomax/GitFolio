import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('production sign-in defers editor, portfolio code, and portfolio fonts until the workspace needs them', async (t) => {
  const f = await projectsFixture(t, browser, { authenticated: false, projects: [projectFixtureData('Deferred portfolio')] });
  const paths = [];
  f.page.on('request', (request) => paths.push(new URL(request.url()).pathname));
  await f.goto('/login');
  await f.page.getByRole('button', { name: 'Continue with GitHub' }).waitFor();
  assert.ok(paths.some((path) => /\/assets\/LoginPage-.*\.js$/.test(path)), 'run this check against the production preview');
  assert.ok(!paths.some((path) => /EditorPage|TemplateArtwork|DesignedPortfolio|\.woff2$/.test(path)));
  assert.ok(!paths.some((path) => /\/logo-|Gitfolio.*logo/.test(path)));
  f.state.authenticated = true;
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'Deferred portfolio', exact: true }).waitFor();
  await f.page.waitForFunction(() => performance.getEntriesByType('resource').some((entry) => entry.name.includes('/assets/TemplateArtwork-')));
  assert.ok(paths.some((path) => /TemplateArtwork-/.test(path)));
});
