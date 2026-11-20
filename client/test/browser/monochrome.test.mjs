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
const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'monochrome');
const catalog = BUILTIN_TEMPLATES.map((preset) => ({ ...preset, preview: preset.defaultConfig.theme }));
function project(subtitle = 'UI 🚀. APIs ✨.') {
  const data = { ...projectFixtureData('Monochrome motion'), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), id: randomUUID(), sortOrder })) };
  data.sections[0].content.subtitle = subtitle;
  return data;
}
async function exported(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', ...options });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  t.after(async () => { await context.close(); assert.deepEqual(errors, []); });
  const files = Object.fromEntries(generateStaticSite(project()).map((file) => [file.path, file.content]));
  await page.route('**/__monochrome-motion/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/').at(-1) || 'index.html';
    return route.fulfill({ contentType: path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html', body: files[path] ?? '' });
  });
  await page.goto('http://127.0.0.1:4173/__monochrome-motion/');
  return page;
}
async function moveOver(page, element, x, y) {
  // The portrait floats continuously, so an automation wait for a stationary
  // hover target would never finish. Move a real mouse to its current bounds.
  const box = await element.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + x, box.y + y);
}

test('monochrome export types, deletes, and cycles editable Unicode phrases without moving the text bar', async (t) => {
  const page = await exported(t);
  await page.locator('.pf-monochrome-typebar[data-monochrome-active]').waitFor();
  await page.locator('[data-monochrome-type]').evaluate((node) => {
    window.typedValues = [node.textContent];
    new MutationObserver(() => window.typedValues.push(node.textContent)).observe(node, { childList: true });
  });
  const height = await page.locator('.pf-monochrome-typebar').evaluate((node) => node.offsetHeight);
  await page.waitForFunction(() => document.querySelector('[data-monochrome-type]').textContent === 'UI 🚀.');
  await page.waitForFunction(() => document.querySelector('[data-monochrome-type]').textContent === 'APIs ✨.');
  await page.waitForFunction(() => document.querySelector('[data-monochrome-type]').textContent === 'UI 🚀.');
  assert.equal(await page.locator('.pf-monochrome-typebar').evaluate((node) => node.offsetHeight), height);
  assert.equal(await page.locator('.pf-monochrome-sr').textContent(), 'UI 🚀. APIs ✨.');
  assert.ok(await page.evaluate(() => window.typedValues.every((value) => Array.from(value).every((character) => {
    const code = character.codePointAt(0); return code < 0xd800 || code > 0xdfff;
  }))));
});

test('monochrome portrait tilt and spotlight reset, and pause and live reduced motion stop all continuous effects', async (t) => {
  const page = await exported(t);
  const orbit = page.locator('.pf-monochrome-orbit-outer');
  const canvas = page.locator('[data-monochrome-particles]');
  const card = page.locator('.pf-monochrome-profile');
  await page.locator('.pf-monochrome-profile-float[data-monochrome-active]').waitFor();
  assert.equal(await orbit.evaluate((node) => getComputedStyle(node).animationPlayState), 'running');
  await moveOver(page, card, 35, 40);
  await page.waitForFunction(() => document.querySelector('.pf-monochrome-profile').style.getPropertyValue('--pf-tilt-y') !== '');
  assert.equal(await page.locator('[data-monochrome-pointer]').count(), 1);
  assert.notEqual(await card.evaluate((node) => node.style.getPropertyValue('--pf-light-x')), '');
  await page.mouse.move(5, 5);
  await page.waitForFunction(() => document.querySelector('.pf-monochrome-profile').style.cssText === '');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const resume = page.getByRole('button', { name: 'Resume motion', exact: true });
  assert.equal(await resume.getAttribute('aria-pressed'), 'true');
  const still = await orbit.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.ready));
    return getComputedStyle(node).transform;
  });
  const pixels = await canvas.evaluate((node) => node.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(await orbit.evaluate((node) => getComputedStyle(node).transform), still);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), pixels);
  assert.equal(await page.locator('[data-monochrome-type]').textContent(), 'UI 🚀. APIs ✨.');
  await resume.focus(); await resume.press('Enter');
  await moveOver(page, card, 40, 45);
  await page.waitForFunction(() => document.querySelector('.pf-monochrome-profile').style.cssText !== '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = page.getByRole('button', { name: 'Reduced motion', exact: true });
  await reduced.waitFor();
  assert.equal(await reduced.getAttribute('aria-disabled'), 'true');
  assert.equal(await orbit.evaluate((node) => getComputedStyle(node).animationName), 'none');
  assert.equal(await card.evaluate((node) => node.style.cssText), '');
  assert.equal(await page.locator('[data-monochrome-pointer]').count(), 0);
  assert.ok(await page.locator('[data-monochrome-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
  const reducedPixels = await canvas.evaluate((node) => node.toDataURL());
  await page.waitForTimeout(120);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), reducedPixels);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).waitFor();
  await page.waitForTimeout(120);
  assert.notEqual(await canvas.evaluate((node) => node.toDataURL()), reducedPixels);
});

test('monochrome reveals replay inside the gallery preview, keep a viewport-sized particle field, and stop off screen', async (t) => {
  const f = await projectsFixture(t, browser, { templates: catalog });
  await f.page.emulateMedia({ reducedMotion: 'no-preference' });
  await f.goto(`/templates/${template.id}`);
  const viewport = f.page.getByTestId('template-preview-viewport');
  await viewport.evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const page = f.page.locator('.pf-monochrome');
  const heading = page.locator('.pf-projects .pf-monochrome-section-heading');
  const position = await viewport.evaluate((node) => node.scrollTop + node.querySelector('.pf-projects').getBoundingClientRect().top - node.getBoundingClientRect().top);
  await viewport.evaluate((node, top) => { node.scrollTop = top; }, position - 100);
  await heading.locator('[data-monochrome-active]').waitFor();
  await f.page.waitForFunction(() => document.querySelector('.pf-projects .pf-monochrome-section-heading').hasAttribute('data-monochrome-in-view'));
  const card = page.locator('.pf-monochrome-project-card').first();
  await moveOver(f.page, card, 40, 80);
  await f.page.waitForFunction(() => document.querySelector('.pf-monochrome-project-card').style.getPropertyValue('--pf-tilt-x') !== '');
  await viewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await f.page.waitForFunction(() => !document.querySelector('.pf-projects .pf-monochrome-section-heading').hasAttribute('data-monochrome-in-view'));
  assert.equal(await page.locator('.pf-monochrome-orbit-outer').evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
  const typed = await page.locator('[data-monochrome-type]').textContent();
  const canvas = page.locator('[data-monochrome-particles]');
  const pixels = await canvas.evaluate((node) => node.toDataURL());
  await f.page.waitForTimeout(120);
  assert.equal(await page.locator('[data-monochrome-type]').textContent(), typed);
  assert.notEqual(await canvas.evaluate((node) => node.toDataURL()), pixels);
  assert.ok(await viewport.evaluate((node) => {
    const rect = node.getBoundingClientRect(), background = node.querySelector('[data-monochrome-background]').getBoundingClientRect();
    return Math.abs(rect.top - background.top) < 2 && background.height <= node.clientHeight + 1;
  }));
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const stopped = await canvas.evaluate((node) => node.toDataURL());
  await f.page.waitForTimeout(100);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), stopped);
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await viewport.evaluate((node, top) => { node.scrollTop = top; }, position - 100);
  await f.page.waitForFunction(() => document.querySelector('.pf-projects .pf-monochrome-section-heading').hasAttribute('data-monochrome-in-view'));
  await viewport.evaluate((node) => { node.style.display = 'none'; });
  await f.page.waitForFunction(() => !document.querySelector('.pf-monochrome').hasAttribute('data-monochrome-running'));
  const hidden = await canvas.evaluate((node) => node.toDataURL());
  await f.page.waitForTimeout(120);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), hidden);
});

test('monochrome Canvas stays still and returning from Preview clears timers, pointer state, and reveal styles', async (t) => {
  const data = project();
  const f = await projectsFixture(t, browser, { projects: [data], templates: catalog });
  await f.goto(`/projects/${data.id}/edit`);
  const page = f.page.getByRole('region', { name: 'Portfolio preview', exact: true }).locator('.pf-monochrome');
  await page.waitFor();
  assert.equal(await page.locator('[data-monochrome-enhanced]').count(), 0);
  assert.equal(await page.getAttribute('data-monochrome-enhanced'), null);
  assert.equal(await page.locator('.pf-monochrome-ticker-track').evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
  assert.equal(await page.locator('[data-monochrome-type]').textContent(), data.sections[0].content.subtitle);
  await f.page.getByRole('button', { name: 'Preview', exact: true }).click();
  await f.page.waitForFunction(() => document.querySelector('.pf-monochrome').hasAttribute('data-monochrome-enhanced'));
  await f.page.getByRole('button', { name: 'Canvas', exact: true }).click();
  await f.page.waitForFunction(() => !document.querySelector('.pf-monochrome').hasAttribute('data-monochrome-enhanced'));
  assert.equal(await page.evaluate((node) => node.style.cssText), '');
  assert.equal(await page.locator('[data-monochrome-in-view],[data-monochrome-active],[data-monochrome-pointer]').count(), 0);
  assert.ok(await page.locator('[data-monochrome-intro],[data-monochrome-reveal],[data-monochrome-tilt],.pf-skills>.pf-tags li').evaluateAll((nodes) => nodes.every((node) => node.style.cssText === '')));
  const canvas = page.locator('[data-monochrome-particles]');
  const pixels = await canvas.evaluate((node) => node.toDataURL());
  await f.page.waitForTimeout(150);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), pixels);
  assert.equal(await page.locator('[data-monochrome-type]').textContent(), data.sections[0].content.subtitle);
  assert.ok(await page.locator('[data-monochrome-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
});

for (const javaScriptEnabled of [false, true]) {
  test(`monochrome reflows at 320px with native keyboard navigation and JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, async (t) => {
    const page = await exported(t, { javaScriptEnabled, viewport: { width: 320, height: 900 }, hasTouch: true, isMobile: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.equal(await page.locator('h1').isVisible(), true);
    const menu = page.locator('.pf-monochrome-menu');
    await menu.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await menu.evaluate((node) => node.open), true);
    const projects = menu.getByRole('link', { name: 'Projects', exact: true });
    await projects.focus(); await projects.press('Enter');
    await page.waitForFunction(() => window.scrollY > 100);
    if (javaScriptEnabled) {
      assert.equal(await menu.evaluate((node) => node.open), false);
      assert.ok(await page.locator('[data-monochrome-tilt]').evaluateAll((nodes) => nodes.every((node) =>
        ['--pf-tilt-x', '--pf-tilt-y', '--pf-light-x', '--pf-light-y'].every((property) => node.style.getPropertyValue(property) === ''))));
    } else {
      assert.equal(await page.locator('[data-monochrome-type]').textContent(), 'UI 🚀. APIs ✨.');
      assert.ok(await page.locator('[data-monochrome-reveal]').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
      assert.equal(await page.locator('.pf-monochrome-ticker-track').evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');
    }
  });
}
