import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { projectsFixture, templateFixtures } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
const catalog = BUILTIN_TEMPLATES.map((template) => ({ ...template, preview: template.defaultConfig.theme }));
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('Templates navigation browses the complete paginated catalog and keeps filters when returning from previews', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.goto('/dashboard');
  await f.page.getByRole('heading', { name: 'Your projects.', exact: true }).waitFor();
  const nav = f.page.getByRole('navigation', { name: 'Workspace navigation', exact: true });
  assert.deepEqual(await nav.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))), ['/dashboard', '/templates', '/account']);
  await nav.getByRole('link', { name: 'Templates', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Templates.', exact: true }).waitFor();
  await f.page.getByRole('article').first().waitFor();
  const firstThumbnail = f.page.locator('[data-template-preview]').first().locator('.pf-thumbnail');
  await firstThumbnail.locator('h1').waitFor();
  assert.equal(await firstThumbnail.locator('h1').textContent(), catalog[0].defaultConfig.sections.find((section) => section.type === 'hero').content.heading);
  assert.equal(await nav.getByRole('link', { name: 'Templates', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await f.page.getByRole('article').count(), 12);
  await f.page.getByText(`${catalog.length} templates · Showing 1–12`, { exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Next templates', exact: true }).click();
  await f.page.getByRole('link', { name: `Preview ${catalog[12].name}`, exact: true }).waitFor();
  assert.equal(await f.page.getByRole('article').count(), catalog.length - 12);
  await f.page.getByRole('link', { name: `Preview ${catalog[12].name}`, exact: true }).click();
  await f.page.getByRole('heading', { name: catalog[12].name, exact: true }).waitFor();
  assert.equal(await nav.getByRole('link', { name: 'Templates', exact: true }).getAttribute('aria-current'), 'page');
  await f.page.getByRole('link', { name: 'Back to templates', exact: true }).click();
  await f.page.getByRole('link', { name: `Preview ${catalog[12].name}`, exact: true }).waitFor();
  assert.equal(new URL(f.page.url()).searchParams.get('page'), '2');
  await f.page.getByRole('button', { name: 'Creative', exact: true }).click();
  await f.page.getByRole('button', { name: 'Creative', exact: true }).waitFor();
  const creative = catalog.filter((template) => template.category === 'creative');
  await f.page.getByRole('link', { name: `Preview ${creative[0].name}`, exact: true }).waitFor();
  assert.equal(await f.page.getByRole('article').count(), creative.length);
  assert.equal(new URL(f.page.url()).searchParams.get('page'), null);
  assert.equal(new URL(f.page.url()).searchParams.get('category'), 'creative');
  assert.equal(f.state.creates, 0);
});

test('every catalog preset has a full preview with its actual saved defaults, including role demos', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  for (const template of catalog) {
    await f.goto(`/templates/${template.id}`);
    await f.page.getByRole('heading', { name: template.name, exact: true, level: 1 }).waitFor();
    const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
    await preview.locator('h1').waitFor();
    assert.equal(await preview.locator('h1').textContent(), template.defaultConfig.sections.find((section) => section.type === 'hero').content.heading);
    assert.equal(await preview.locator('[data-section-id]').count(), template.defaultConfig.sections.filter((section) => section.visible).length);
    assert.equal(await f.page.getByRole('link', { name: 'Use template', exact: true }).getAttribute('href'), `/projects/new?templateId=${template.id}`);
  }
  assert.equal(f.state.creates, 0);
  assert.equal(f.state.projectRequests, 0);
});

test('gallery and responsive preview fit mobile widths and allow keyboard viewport changes', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  const template = catalog.find((preset) => preset.defaultConfig.theme.layout === 'monochrome');
  for (const width of [320, 375, 768, 1440]) {
    await f.page.setViewportSize({ width, height: 1000 });
    await f.goto('/templates'); await f.page.getByRole('article').first().waitFor();
    assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `gallery overflow at ${width}`);
    await f.goto(`/templates/${template.id}`); await f.page.getByRole('heading', { name: template.name, exact: true }).waitFor();
    const viewport = f.page.getByTestId('template-preview-viewport'); await viewport.locator('.pf-page').waitFor();
    for (const device of ['mobile', 'tablet', 'desktop']) {
      const button = f.page.getByRole('button', { name: `${device} preview width`, exact: true });
      await button.focus(); await button.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${device} preview overflow at ${width}`);
      assert.ok(await viewport.locator('.pf-page').evaluate((node) => node.scrollWidth <= node.clientWidth + 1));
      const box = await viewport.boundingBox();
      if (device === 'mobile') assert.ok(box.width <= 376);
      if (device === 'tablet') assert.ok(box.width <= 769);
    }
    await viewport.focus(); await f.page.keyboard.press('PageDown');
    assert.ok(await viewport.evaluate((node) => node.scrollTop > 0), 'full preview supports keyboard scrolling');
    if (process.env.GITFOLIO_GALLERY_SCREENSHOTS && [375, 1440].includes(width)) {
      mkdirSync(process.env.GITFOLIO_GALLERY_SCREENSHOTS, { recursive: true });
      await f.page.screenshot({ path: join(process.env.GITFOLIO_GALLERY_SCREENSHOTS, `preview-${width}.png`), fullPage: true });
      await f.goto('/templates'); await f.page.getByRole('article').first().waitFor();
      for (const thumbnail of await f.page.locator('[data-template-preview]').all()) {
        await thumbnail.scrollIntoViewIfNeeded();
        await thumbnail.locator('.pf-thumbnail').waitFor();
      }
      await f.page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
      await f.page.screenshot({ path: join(process.env.GITFOLIO_GALLERY_SCREENSHOTS, `gallery-${width}.png`), fullPage: true });
    }
  }
});

test('Use template opens project details with the chosen preset and creates only after submission', async (t) => {
  for (const fromPreview of [false, true]) {
    const template = fromPreview ? catalog.find((preset) => preset.defaultConfig.theme.layout === 'monochrome') : catalog[0];
    const f = await projectsFixture(t, browser, { templates: catalog });
    await f.goto(fromPreview ? `/templates/${template.id}` : '/templates');
    await f.page.getByRole('link', { name: fromPreview ? 'Use template' : `Use ${template.name}`, exact: true }).click();
    await f.page.getByLabel('Project name', { exact: true }).waitFor();
    await f.page.getByRole('heading', { name: template.name, exact: true }).waitFor();
    assert.equal(new URL(f.page.url()).searchParams.get('templateId'), template.id);
    assert.equal(f.state.creates, 0);
    await f.page.getByLabel('Project name', { exact: true }).fill(fromPreview ? 'Preview selection' : 'Gallery selection');
    await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
    await f.page.waitForURL('**/dashboard');
    assert.equal(f.state.creates, 1);
    assert.equal(f.state.projects[0].templateId, template.id);
    assert.deepEqual(f.state.projects[0].themeConfig, template.defaultConfig.theme);
    assert.deepEqual(f.state.projects[0].sections.map(({ id, sortOrder, ...section }) => section), template.defaultConfig.sections);
  }
});

test('template gallery and preview keep session guards and reject malformed IDs before requesting details', async (t) => {
  for (const route of ['/templates', `/templates/${catalog[0].id}`]) {
    const f = await projectsFixture(t, browser, { authenticated: false, templates: catalog });
    await f.goto(route); await f.page.waitForURL('**/login');
    assert.equal(f.state.templateRequests, 0);
  }
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.goto('/templates/not-a-valid-id');
  await f.page.getByRole('heading', { name: 'Template not found.', exact: true }).waitFor();
  assert.equal(f.state.templateRequests, 0);
  await f.goto(`/templates/${randomUUID()}`);
  await f.page.getByRole('heading', { name: 'Template not found.', exact: true }).waitFor();
  assert.equal(f.state.templateRequests, 1);
  for (const search of ['?templateId=bad', `?templateId=${catalog[0].id}&templateId=${catalog[1].id}`]) {
    await f.goto(`/projects/new${search}`);
    await f.page.getByRole('radio').first().waitFor();
    assert.equal(await f.page.getByRole('button', { name: 'Continue', exact: true }).isEnabled(), false);
  }
  assert.equal(f.state.creates, 0);
});

test('gallery outages, empty results, preview failures and legacy presets remain usable', async (t) => {
  const f = await projectsFixture(t, browser, { templates: templateFixtures, failTemplates: true });
  await f.goto('/templates'); await f.page.getByRole('heading', { name: 'Templates couldn’t load.', exact: true }).waitFor();
  f.state.failTemplates = false;
  await f.page.getByRole('button', { name: 'Try again', exact: true }).click();
  await f.page.getByRole('article').first().waitFor();
  f.state.failTemplateDetail = true;
  await f.page.getByRole('link', { name: 'Preview Canvas', exact: true }).click();
  await f.page.getByRole('heading', { name: 'This preview couldn’t load.', exact: true }).waitFor();
  f.state.failTemplateDetail = false;
  await f.page.getByRole('button', { name: 'Try again', exact: true }).click();
  await f.page.getByRole('region', { name: 'Portfolio preview', exact: true }).getByRole('heading', { name: 'Your name', exact: true }).waitFor();
  const empty = await projectsFixture(t, browser, { templates: [] });
  await empty.goto('/templates'); await empty.page.getByRole('heading', { name: 'No templates found.', exact: true }).waitFor();
  assert.equal(await empty.page.getByRole('button', { name: 'Show all templates', exact: true }).isVisible(), true);
});

test('gallery URL filters are validated and out-of-range pages recover to an available page', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.goto('/templates?page=-2&category=not-a-category');
  await f.page.getByRole('article').first().waitFor();
  await f.page.waitForURL('**/templates');
  assert.equal(await f.page.getByRole('button', { name: 'All styles', exact: true }).getAttribute('aria-pressed'), 'true');
  await f.goto('/templates?page=999');
  await f.page.waitForURL('**/templates?page=2');
  await f.page.getByRole('link', { name: `Preview ${catalog[12].name}`, exact: true }).waitFor();
  assert.equal(await f.page.getByRole('article').count(), catalog.length - 12);
  assert.equal(f.state.creates, 0);
});
