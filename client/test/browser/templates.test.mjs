import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { BUILTIN_TEMPLATES } from '../../../packages/shared/dist/index.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateStaticSite } from '../../../server/dist/generators/static.generator.js';
import { projectFixtureData, projectsFixture } from './helpers/projects.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

for (const template of BUILTIN_TEMPLATES) test(`${template.name} renders its own composition, persists edits, and reflows`, async (t) => {
  const project = { ...projectFixtureData('Design portfolio'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
  project.sectionCount = project.sections.length;
  const f = await projectsFixture(t, browser, { projects: [project], templates: BUILTIN_TEMPLATES.map((preset) => ({ ...preset, preview: preset.defaultConfig.theme })) });
  await f.goto(`/projects/${project.id}/edit`);
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.locator(`.pf-${template.defaultConfig.theme.layout}`).waitFor();
  assert.equal(await preview.locator('h1').textContent(), project.sections.find((s) => s.type === 'hero').content.heading);
  assert.equal(await preview.locator('[data-section-id]').count(), project.sections.length);
  await f.page.getByLabel('Section heading', { exact: true }).fill('Work that makes a difference.');
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await preview.getByRole('heading', { name: 'Work that makes a difference.', exact: true }).waitFor();
  for (const width of [1440, 768, 375, 320]) {
    await f.page.setViewportSize({ width, height: 1000 });
    assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `page overflow at ${width}`);
    assert.ok(await preview.locator('.pf-page').evaluate((node) => node.scrollWidth <= node.clientWidth + 1), `portfolio overflow at ${width}`);
  }
  if (template.defaultConfig.theme.layout === 'minimal') assert.equal(await preview.locator('.pf-minimal-project').count(), 2);
  if (template.defaultConfig.theme.layout === 'executive') assert.equal(await preview.getByRole('table').count(), 1);
  if (template.defaultConfig.theme.layout === 'bento') assert.ok(await preview.locator('details').count() >= 2);
});

for (const template of BUILTIN_TEMPLATES) test(`${template.name} publishes responsive semantic markup and usable controls`, async (t) => {
  const project = { ...projectFixtureData('Published portfolio'), templateId: template.id, template, themeConfig: template.defaultConfig.theme,
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...section, id: randomUUID(), sortOrder })) };
  const files = Object.fromEntries(generateStaticSite(project).map((file) => [file.path, file.content]));
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/__template-static/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
    return route.fulfill({ status: 200, contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
  });
  await page.goto('http://127.0.0.1:4173/__template-static/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `published overflow at ${width}`);
    assert.equal(await page.locator('h1').count(), 1);
    if (process.env.GITFOLIO_TEMPLATE_SCREENSHOTS && [1440,375].includes(width)) {
      mkdirSync(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: join(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS, `${template.defaultConfig.theme.layout}-${width}.png`), fullPage: true });
    }
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  if (template.defaultConfig.theme.layout === 'terminal') {
    await page.getByRole('textbox', { name: 'Contact command' }).fill('help');
    await page.getByRole('button', { name: 'Run command' }).click();
    await page.locator('[data-shell-output]').getByText('help · email · links · clear', { exact: false }).waitFor();
    await page.getByRole('textbox', { name: 'Contact command' }).fill('<script>alert(1)</script>');
    await page.getByRole('button', { name: 'Run command' }).click();
    assert.equal(await page.locator('[data-shell-output] script').count(), 0);
  }
  if (template.defaultConfig.theme.layout === 'bento') {
    const widget = page.locator('details').first();
    await widget.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await widget.evaluate((node) => node.open), true);
    assert.equal(await widget.locator('.pf-description').isVisible(), true);
  }
  assert.deepEqual(errors, []);
});
