import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { BUILTIN_TEMPLATES as ALL_TEMPLATES, isRoleLayout } from '../../../packages/shared/dist/index.js';
const BUILTIN_TEMPLATES = ALL_TEMPLATES.filter((item) => !isRoleLayout(item.defaultConfig.theme.layout));
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
      await page.screenshot({ path: join(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS, `${template.id}-${width}.png`), fullPage: true });
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

test('every catalog design previews its own content and can be created with its saved defaults', async (t) => {
  const f = await projectsFixture(t, browser, { templates: BUILTIN_TEMPLATES.map((preset) => ({ ...preset, preview: preset.defaultConfig.theme })) });
  await f.goto('/projects/new');
  await f.page.getByRole('radio').first().waitFor();
  const pageSize = await f.page.getByRole('radio').count();
  if (process.env.GITFOLIO_TEMPLATE_SCREENSHOTS) await f.page.screenshot({ path: join(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS, 'catalog.png'), fullPage: true });
  for (const [index, template] of BUILTIN_TEMPLATES.entries()) {
    if (index > 0) await f.goto('/projects/new');
    await f.page.getByRole('radio').first().waitFor();
    for (let page = 0; page < Math.floor(index / pageSize); page++) {
      const previousId = await f.page.getByRole('radio').first().getAttribute('value');
      await f.page.getByRole('button', { name: 'Next templates', exact: true }).click();
      await f.page.waitForFunction((id) => document.querySelector('input[name="template"]')?.value !== id, previousId);
    }
    const radio = f.page.getByRole('radio', { name: template.name, exact: true });
    await radio.waitFor({ state: 'attached' });
    const thumbnail = radio.locator('..').locator('.pf-thumbnail');
    assert.equal(await thumbnail.locator('h1').textContent(), template.defaultConfig.sections.find((section) => section.type === 'hero').content.heading);
    const box = await thumbnail.locator('.pf-page').boundingBox();
    const frame = await thumbnail.boundingBox();
    assert.ok(box.width <= frame.width + 1 && box.width > frame.width - 2, 'thumbnail scales to its card');
    await radio.focus(); await radio.press('Space');
    await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await f.page.getByLabel('Project name', { exact: true }).fill(`Design example ${index + 1}`);
    await f.page.getByRole('button', { name: 'Create project', exact: true }).click();
    await f.page.waitForURL('**/dashboard');
    const created = f.state.projects.find((project) => project.templateId === template.id);
    assert.deepEqual(created.themeConfig, template.defaultConfig.theme);
    assert.deepEqual(created.sections.map(({ id, sortOrder, ...section }) => section), template.defaultConfig.sections);
  }
  assert.equal(f.state.creates, BUILTIN_TEMPLATES.length);
});

test('new metric, cover, contact links, and paired type controls persist through the editor', async (t) => {
  const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'bento');
  const project = { ...projectFixtureData('Rich content'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
  const f = await projectsFixture(t, browser, { projects: [project], templates: BUILTIN_TEMPLATES });
  await f.goto(`/projects/${project.id}/edit`);
  await f.page.getByLabel('Metric 1 value', { exact: true }).fill('32');
  const preview = f.page.getByRole('region', { name: 'Portfolio preview', exact: true });
  await preview.getByRole('button', { name: 'Select projects section', exact: true }).click();
  await f.page.getByLabel('Entry 1 cover graphic', { exact: true }).selectOption('architecture');
  await preview.getByRole('button', { name: 'Select contact section', exact: true }).click();
  await f.page.getByLabel('Entry 2 link', { exact: true }).fill('https://example.com/my-work');
  await f.page.getByRole('button', { name: /^theme$/i }).click();
  await f.page.getByLabel('Heading font', { exact: true }).selectOption('serif');
  await f.page.getByLabel('Label sample content as illustrative', { exact: true }).uncheck();
  await f.page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await f.page.getByText('All changes saved', { exact: true }).waitFor();
  await f.page.reload();
  await preview.locator('.pf-metrics dd').getByText('32', { exact: true }).waitFor();
  assert.equal(await preview.locator('.pf-art-architecture').count(), 1);
  assert.equal(await preview.locator('.pf-demo').count(), 0);
  assert.ok((await preview.locator('h1').evaluate((node) => getComputedStyle(node).fontFamily)).includes('Newsreader'));
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  assert.equal(await preview.getByRole('link', { name: 'Code & experiments ↗', exact: true }).getAttribute('href'), 'https://example.com/my-work');
});
