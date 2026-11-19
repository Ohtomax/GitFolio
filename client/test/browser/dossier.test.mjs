import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { generateStaticSite } from '../../../server/dist/generators/static.generator.js';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });
const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'dossier');
function project() {
  return { ...projectFixtureData('Security dossier'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
}

test('dossier preview switches sections, transfers focus, and restores every section for editing', async (t) => {
  const data = project();
  const f = await projectsFixture(t, browser, { projects: [data], templates: BUILTIN_TEMPLATES });
  await f.goto(`/projects/${data.id}/edit`);
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.locator('.pf-dossier').waitFor();
  assert.equal(await preview.locator('.pf-dossier-panel:visible').count(), data.sections.length);
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  await preview.getByRole('link', { name: 'View case studies', exact: false }).click();
  await preview.getByRole('heading', { name: 'Investigations with a paper trail.', exact: true }).waitFor();
  assert.equal(await preview.locator('.pf-dossier-panel:visible').count(), 1);
  assert.equal(await f.page.locator(':focus').getAttribute('data-section-type'), 'projects');
  await f.page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await preview.getByRole('heading', { name: 'Evidence first. Defense always.', exact: true }).waitFor();
  assert.equal(await preview.locator('.pf-dossier-panel:visible').count(), data.sections.length);
  await preview.getByRole('button', { name: 'Select projects section', exact: true }).click();
  await f.page.getByLabel('Section heading', { exact: true }).fill('My authorized investigations.');
  await f.page.getByLabel('Entry 1 title', { exact: true }).fill('A custom detection lab');
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await preview.getByRole('heading', { name: 'My authorized investigations.', exact: true }).waitFor();
  assert.equal(await preview.getByRole('heading', { name: 'A custom detection lab', exact: true }).count(), 1);
  assert.equal(await preview.locator('.pf-dossier-panel:visible').count(), data.sections.length);
});

test('dossier exports have keyboard navigation, mobile section selection, deep links, and readable no-JavaScript content', async (t) => {
  const data = project();
  const files = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  const work = data.sections.find((section) => section.type === 'projects');
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/__dossier-controls/**', (route) => {
      const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
      return route.fulfill({ contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
    });
    const base = 'http://127.0.0.1:4173/__dossier-controls/';
    await page.goto(base);
    const workPanel = page.locator(`#portfolio-${work.id}`);
    const navLink = page.locator('.pf-dossier-rail').getByRole('link', { name: 'Case studies', exact: true });
    await navLink.focus(); await page.keyboard.press('Enter');
    await workPanel.getByRole('heading', { name: work.content.heading, exact: true }).waitFor();
    if (javaScriptEnabled) {
      assert.equal(await page.locator('.pf-dossier-panel:visible').count(), 1);
      assert.equal(await navLink.getAttribute('aria-current'), 'location');
      assert.equal(await page.locator(':focus').getAttribute('id'), `portfolio-${work.id}`);
    } else assert.equal(await page.locator('.pf-dossier-panel:visible').count(), data.sections.length);
    await page.setViewportSize({ width: 320, height: 844 });
    const menu = page.locator('.pf-dossier-menu');
    await menu.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await menu.evaluate((node) => node.open), true);
    await menu.getByRole('link', { name: 'Contact', exact: true }).click();
    await page.getByRole('link', { name: 'Email Nadia', exact: true }).waitFor();
    if (javaScriptEnabled) assert.equal(await menu.evaluate((node) => node.open), false);
    else await menu.locator('summary').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.equal(await page.locator('.pf-dossier').evaluate((node) => getComputedStyle(node, '::after').animationName), 'none');
    for (const link of await page.locator('a[target="_blank"]').all()) assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    await page.goto(base + '#portfolio-' + work.id);
    await workPanel.getByRole('heading', { name: work.content.heading, exact: true }).waitFor();
    assert.deepEqual(errors, []);
  }
});
