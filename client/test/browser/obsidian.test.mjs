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
  assert.equal(await artwork.locator('[data-obsidian-enhanced]').count(), 0);
  await f.page.evaluate(() => { document.getElementById('gitfolio-portfolio-designs').textContent = '/* stale preview styles */'; });
  await preview.click();
  await f.page.getByRole('heading', { name: template.name, exact: true }).waitFor();
  assert.ok(await f.page.locator('#gitfolio-portfolio-designs').evaluate((node) => node.textContent.includes('@keyframes pf-obsidian-drift')));
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
  assert.equal(await preview.locator('[data-obsidian-enhanced]').count(), 0);
  assert.equal(await preview.getByRole('button', { name: 'Pause motion', exact: true }).isVisible(), false);
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  await preview.locator('[data-obsidian-enhanced]').waitFor();
  await f.page.getByRole('button', { name: 'Canvas', exact: true }).click();
  assert.equal(await preview.locator('[data-obsidian-enhanced]').count(), 0);
  assert.equal(await preview.locator('[data-obsidian-in-view]').count(), 0);
  assert.ok(await preview.locator('[data-obsidian-intro]').evaluateAll((nodes) => nodes.every((node) => node.style.getPropertyValue('--pf-intro-index') === '')));
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
  if (!javaScriptEnabled) assert.equal(await page.getByRole('button', { name: 'Pause motion', exact: true }).isVisible(), false);
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

test('Obsidian animates its live preview, pauses and resumes, respects reduced motion, and stops off screen', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.page.emulateMedia({ reducedMotion: 'no-preference' });
  await f.goto(`/templates/${template.id}`);
  const page = f.page.locator('.pf-obsidian');
  await page.locator('.pf-obsidian-ambient[data-obsidian-active]').waitFor();
  const contours = page.locator('.pf-obsidian-contours');
  assert.equal(await contours.evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  const moving = await contours.evaluate((node) => getComputedStyle(node).transform);
  await f.page.waitForTimeout(160);
  assert.notEqual(await contours.evaluate((node) => getComputedStyle(node).transform), moving);
  assert.equal(await page.locator('.pf-obsidian-portrait').evaluate((node) => getComputedStyle(node).animationName), 'pf-obsidian-glow');
  assert.equal(await page.locator('.pf-obsidian-portrait').evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const resume = page.getByRole('button', { name: 'Resume motion', exact: true });
  assert.equal(await resume.getAttribute('aria-pressed'), 'true');
  const still = await contours.evaluate((node) => getComputedStyle(node).transform);
  await f.page.waitForTimeout(160);
  assert.equal(await contours.evaluate((node) => getComputedStyle(node).transform), still);
  await resume.focus(); await resume.press('Enter');
  assert.equal(await contours.evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  const artwork = page.locator('[data-obsidian-tilt]').first();
  await artwork.scrollIntoViewIfNeeded();
  await page.locator('.pf-obsidian-card[data-obsidian-in-view]').first().waitFor();
  await artwork.hover({ position: { x: 35, y: 35 } });
  await f.page.waitForFunction(() => document.querySelector('[data-obsidian-tilt]').style.getPropertyValue('--pf-tilt-y') !== '');
  await f.page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = page.getByRole('button', { name: 'Reduced motion', exact: true });
  await reduced.waitFor();
  assert.equal(await reduced.getAttribute('aria-disabled'), 'true');
  assert.equal(await contours.evaluate((node) => getComputedStyle(node).animationName), 'none');
  assert.equal(await artwork.evaluate((node) => node.style.getPropertyValue('--pf-tilt-y')), '');
  assert.ok(await page.locator('[data-obsidian-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
  await f.page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).waitFor();
  const viewport = f.page.getByTestId('template-preview-viewport');
  await viewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await f.page.waitForFunction(() => !document.querySelector('.pf-obsidian-ambient').hasAttribute('data-obsidian-active'));
  assert.equal(await contours.evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
  await f.page.setViewportSize({ width: 320, height: 1000 });
  await viewport.evaluate((node) => { node.scrollTop = 0; });
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.ok(await page.evaluate((node) => node.scrollWidth <= node.clientWidth + 1));
  assert.equal(await page.getByRole('button', { name: 'Pause motion', exact: true }).isVisible(), true);
});

test('Obsidian static export includes working motion controls and scroll reveals', async (t) => {
  const files = Object.fromEntries(generateStaticSite(project()).map((file) => [file.path, file.content]));
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 1000 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://obsidian-motion.example.test/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
    return route.fulfill({ contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
  });
  await page.goto('https://obsidian-motion.example.test/');
  await page.locator('[data-obsidian-enhanced]').waitFor();
  await page.locator('.pf-obsidian-ambient[data-obsidian-active]').waitFor();
  assert.equal(await page.locator('.pf-obsidian-contours').evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  const belowFold = page.locator('.pf-obsidian-card').last();
  assert.equal(await belowFold.getAttribute('data-obsidian-in-view'), null);
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('.pf-obsidian-card');
    return getComputedStyle(cards[cards.length - 1]).opacity === '0';
  });
  assert.equal(await belowFold.evaluate((node) => getComputedStyle(node).opacity), '0');
  await belowFold.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('.pf-obsidian-card');
    return getComputedStyle(cards[cards.length - 1]).opacity === '1';
  });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page.getByRole('button', { name: 'Resume motion', exact: true }).waitFor();
  assert.equal(await page.locator('.pf-obsidian-contours').evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  const card = page.locator('.pf-obsidian-card').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.pf-obsidian-card').hasAttribute('data-obsidian-in-view'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Reduced motion', exact: true }).waitFor();
  assert.equal(await card.evaluate((node) => getComputedStyle(node).opacity), '1');
  assert.deepEqual(errors, []);
});
