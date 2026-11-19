import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { generateStaticSite } from '../../../server/dist/generators/static.generator.js';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'obsidian');
const catalog = BUILTIN_TEMPLATES.map((preset) => ({ ...preset, preview: preset.defaultConfig.theme }));
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });
function project() {
  const sections = template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() }));
  return { ...projectFixtureData('Obsidian journal'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme), sections, sectionCount: sections.length };
}

test('Premium gallery previews Obsidian and creates a project with its own defaults', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.goto('/templates');
  await f.page.getByRole('button', { name: 'Premium', exact: true }).click();
  const preview = f.page.getByRole('link', { name: `Preview ${template.name}`, exact: true });
  await preview.waitFor();
  assert.equal(new URL(f.page.url()).searchParams.get('category'), 'premium');
  const artwork = preview.locator('.pf-thumbnail');
  await artwork.locator('h1').waitFor();
  assert.equal(await artwork.locator('h1').textContent(), 'Alex Morgan');
  await preview.click();
  await f.page.getByRole('heading', { name: template.name, exact: true }).waitFor();
  await f.page.getByRole('link', { name: 'Use template', exact: true }).first().click();
  await f.page.getByLabel('Project name', { exact: true }).fill('My developer journal');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  const created = f.state.projects.find((item) => item.templateId === template.id);
  assert.ok(created);
  assert.deepEqual(created.themeConfig, template.defaultConfig.theme);
  assert.deepEqual(created.sections.map(({ id, sortOrder, ...section }) => section), template.defaultConfig.sections);
});

test('Obsidian profile, portrait, and experience edits survive saving and reloading', async (t) => {
  const data = project();
  const f = await projectsFixture(t, browser, { projects: [data], templates: catalog });
  await f.page.route('https://example.com/obsidian-portrait.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#555"/></svg>' }));
  await f.goto(`/projects/${data.id}/edit`);
  await f.page.getByLabel('Section heading', { exact: true }).fill('Avery Quinn');
  await f.page.getByLabel('Portrait image URL', { exact: true }).fill('https://example.com/obsidian-portrait.svg');
  await f.page.getByLabel('Portrait description', { exact: true }).fill('Avery’s portrait');
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.getByRole('button', { name: 'Select experience section', exact: true }).click();
  await f.page.getByLabel('Entry 1 description', { exact: true }).fill('My own experience and contributions.');
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await preview.getByRole('heading', { name: 'Avery Quinn', exact: true }).waitFor();
  assert.equal(await preview.getByRole('img', { name: 'Avery’s portrait', exact: true }).getAttribute('src'), 'https://example.com/obsidian-portrait.svg');
  await preview.getByText('My own experience and contributions.', { exact: true }).waitFor();
});

for (const javaScriptEnabled of [true, false]) test(`Obsidian export reflows and supports keyboard disclosures with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, async (t) => {
  const data = project();
  const files = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://obsidian.example.test/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
    return route.fulfill({ contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
  });
  await page.goto('https://obsidian.example.test/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1024, 768, 650, 480, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `export overflow at ${width}`);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').isVisible(), true);
    assert.equal(await page.locator('[data-section-id]').count(), data.sections.length);
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  const experience = page.locator('.pf-obsidian-experience').nth(1);
  assert.equal(await experience.evaluate((node) => node.open), false);
  await experience.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await experience.evaluate((node) => node.open), true);
  assert.equal(await experience.locator('.pf-description').isVisible(), true);
  await page.getByRole('navigation', { name: 'Portfolio sections', exact: true }).getByRole('link', { name: 'Projects', exact: true }).click();
  assert.equal(new URL(page.url()).hash, `#portfolio-${data.sections.find((section) => section.type === 'projects').id}`);
  assert.deepEqual(errors, []);
});
