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
const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'kinetic');
const catalog = BUILTIN_TEMPLATES.map((preset) => ({ ...preset, preview: preset.defaultConfig.theme }));
function project() {
  return { ...projectFixtureData('Kinetic portfolio'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
}

test('Premium filters the gallery and project picker, preserves preview context, and creates the animated preset', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.page.setViewportSize({ width: 320, height: 1000 });
  await f.goto('/templates?page=2');
  await f.page.getByRole('button', { name: 'Premium', exact: true }).click();
  await f.page.getByRole('link', { name: `Preview ${template.name}`, exact: true }).waitFor();
  assert.equal(new URL(f.page.url()).search, '?category=premium');
  assert.equal(await f.page.getByRole('article').count(), catalog.filter((item) => item.category === 'premium').length);
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await f.page.getByRole('link', { name: `Preview ${template.name}`, exact: true }).click();
  await f.page.getByRole('heading', { name: template.name, exact: true, level: 1 }).waitFor();
  await f.page.getByRole('link', { name: 'Back to templates', exact: true }).click();
  await f.page.getByRole('button', { name: 'Premium', exact: true }).waitFor();
  assert.equal(new URL(f.page.url()).search, '?category=premium');
  assert.equal(await f.page.getByRole('button', { name: 'Premium', exact: true }).getAttribute('aria-pressed'), 'true');
  await f.goto('/projects/new');
  await f.page.getByRole('button', { name: 'Premium', exact: true }).click();
  const choice = f.page.getByRole('radio', { name: template.name, exact: true });
  await choice.waitFor({ state: 'attached' });
  assert.equal(await f.page.getByRole('radio').count(), 1);
  await choice.focus(); await choice.press('Space');
  await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
  await f.page.getByLabel('Project name', { exact: true }).fill('My animated portfolio');
  await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
  await f.page.waitForURL('**/dashboard');
  const saved = f.state.projects.find((item) => item.templateId === template.id);
  assert.deepEqual(saved.themeConfig, template.defaultConfig.theme);
  assert.deepEqual(saved.sections.map(({ id, sortOrder, ...section }) => section), template.defaultConfig.sections);
});

test('kinetic motion can pause, respects live reduced motion, responds to a mouse, and stops off screen', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.page.emulateMedia({ reducedMotion: 'no-preference' });
  await f.goto(`/templates/${template.id}`);
  const page = f.page.locator('.pf-kinetic');
  const sphere = page.locator('.pf-kinetic-sphere');
  await page.locator('.pf-kinetic-hero-scene[data-kinetic-active]').waitFor();
  assert.equal(await sphere.evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const resume = page.getByRole('button', { name: 'Resume motion', exact: true }); await resume.waitFor();
  const still = await sphere.evaluate((node) => getComputedStyle(node).transform);
  await f.page.waitForTimeout(120);
  assert.equal(await sphere.evaluate((node) => getComputedStyle(node).transform), still);
  assert.equal(await sphere.evaluate((node) => getComputedStyle(node).animationName), 'none');
  await resume.focus(); await resume.press('Enter');
  const tilt = page.locator('.pf-kinetic-sculpture');
  await tilt.hover({ position: { x: 45, y: 50 } });
  await f.page.waitForFunction(() => document.querySelector('.pf-kinetic-sculpture').style.getPropertyValue('--pf-tilt-y') !== '');
  await f.page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = page.getByRole('button', { name: 'Reduced motion', exact: true }); await reduced.waitFor();
  assert.equal(await reduced.getAttribute('aria-disabled'), 'true');
  assert.equal(await sphere.evaluate((node) => getComputedStyle(node).animationName), 'none');
  assert.equal(await tilt.evaluate((node) => node.style.getPropertyValue('--pf-tilt-y')), '');
  assert.ok(await page.locator('[data-kinetic-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
  await f.page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).waitFor();
  const viewport = f.page.getByTestId('template-preview-viewport');
  await viewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await f.page.waitForFunction(() => !document.querySelector('.pf-kinetic-hero-scene').hasAttribute('data-kinetic-active'));
  assert.equal(await sphere.evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
});

test('kinetic canvas stays still, saves a custom identity and portrait, and cleans up preview motion', async (t) => {
  const data = project();
  const f = await projectsFixture(t, browser, { projects: [data], templates: catalog });
  await f.page.route('https://example.com/kinetic-portrait.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#4938dc"/></svg>' }));
  await f.goto(`/projects/${data.id}/edit`);
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.locator('.pf-kinetic').waitFor();
  assert.equal(await preview.locator('[data-kinetic-enhanced]').count(), 0);
  assert.equal(await preview.getByRole('button', { name: 'Pause motion', exact: true }).isVisible(), false);
  assert.equal(await preview.locator('.pf-kinetic-sphere').evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
  await f.page.getByLabel('Eyebrow', { exact: true }).fill('Morgan Ellis / Interaction designer');
  await f.page.getByLabel('Portrait image URL', { exact: true }).fill('https://example.com/kinetic-portrait.svg');
  await f.page.getByLabel('Portrait description', { exact: true }).fill('An original custom portrait');
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await preview.getByRole('img', { name: 'An original custom portrait', exact: true }).waitFor();
  assert.equal(await f.page.getByLabel('Eyebrow', { exact: true }).inputValue(), 'Morgan Ellis / Interaction designer');
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  await preview.locator('[data-kinetic-enhanced]').waitFor();
  await f.page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await f.page.waitForFunction(() => !document.querySelector('.pf-kinetic').hasAttribute('data-kinetic-enhanced'));
  assert.equal(await preview.locator('[data-kinetic-in-view]').count(), 0);
  assert.equal(await preview.locator('.pf-kinetic-sculpture').evaluate((node) => node.style.cssText), '');
  assert.ok(await preview.locator('[data-kinetic-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
});

test('kinetic static export remains readable without JavaScript and has native keyboard mobile navigation', async (t) => {
  const data = project();
  const files = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 320, height: 1000 }, reducedMotion: 'reduce' });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/__kinetic-controls/**', (route) => {
      const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
      return route.fulfill({ contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
    });
    await page.goto('http://127.0.0.1:4173/__kinetic-controls/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
    assert.equal(await page.locator('h1').isVisible(), true);
    assert.ok(await page.locator('[data-kinetic-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
    assert.equal(await page.locator('.pf-kinetic-sphere').evaluate((node) => getComputedStyle(node).animationName), 'none');
    const menu = page.locator('.pf-kinetic-menu');
    await menu.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await menu.evaluate((node) => node.open), true);
    await menu.getByRole('link', { name: 'Projects', exact: true }).click();
    if (javaScriptEnabled) assert.equal(await menu.evaluate((node) => node.open), false);
    else await menu.locator('summary').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const link of await page.locator('a[target="_blank"]').all()) assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    assert.deepEqual(errors, []);
  }
});
