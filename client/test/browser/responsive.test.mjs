import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { before, after, test } from 'node:test';
import { BUILTIN_TEMPLATES, ProjectSchema } from '../../../packages/shared/dist/index.js';
import { projectFixtureData } from './helpers/projects.mjs';
import { deploymentFixtureData, deploymentsFixture } from './helpers/deployments.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

async function fits(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scroll <= dimensions.width + 1, `${label}: ${dimensions.scroll}px exceeds ${dimensions.width}px`);
  if (process.env.GITFOLIO_AUDIT_SCREENSHOTS && [375, 1280].includes(dimensions.width)) {
    mkdirSync(process.env.GITFOLIO_AUDIT_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: join(process.env.GITFOLIO_AUDIT_SCREENSHOTS, `${label}-${dimensions.width}.png`), fullPage: true });
  }
}

test('workspace routes, project setup, and dialogs reflow from 320px through desktop with long content', async (t) => {
  const project = projectFixtureData('Portfolio for distributed systems and thoughtful product engineering '.repeat(2).slice(0, 100));
  project.slug = 'distributed-systems-and-thoughtful-product-engineering';
  project.repoName = 'portfolio-for-distributed-systems-and-thoughtful-product-engineering';
  ProjectSchema.parse(project);
  const f = await deploymentsFixture(t, browser, { projects: [project], templates: BUILTIN_TEMPLATES,
    deployments: [deploymentFixtureData(project, 'LIVE')] });
  f.session.user.name = 'Alexandria Developer With A Deliberately Long Display Name';
  f.session.user.email = 'alexandria.developer.with.a.long.address@example.test';
  for (const width of [320, 375, 768, 1280, 1600]) {
    await f.page.setViewportSize({ width, height: 1000 });
    await f.goto('/dashboard'); await f.page.getByRole('heading', { name: 'Your projects.' }).waitFor(); await fits(f.page, 'dashboard');
    await f.page.getByRole('button', { name: `Manage ${project.name}`, exact: true }).click();
    await f.page.getByRole('dialog').getByLabel('Project name', { exact: true }).waitFor(); await fits(f.page, 'project-dialog');
    const dialog = await f.page.getByRole('dialog').boundingBox(); assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= width + 1);
    await f.page.keyboard.press('Escape'); await f.page.getByRole('dialog').waitFor({ state: 'detached' });
    await f.goto('/account'); await f.page.getByRole('heading', { name: /Welcome,/ }).waitFor(); await fits(f.page, 'account');
    await f.goto('/projects/new'); await f.page.getByRole('radio').first().waitFor(); await fits(f.page, 'template-picker');
    await f.page.getByText(BUILTIN_TEMPLATES[0].name, { exact: true }).click(); await f.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await f.page.getByLabel('Project name', { exact: true }).waitFor(); await fits(f.page, 'project-setup');
    await f.goto(`/projects/${project.id}/edit`); await f.page.getByLabel('Section heading', { exact: true }).waitFor(); await fits(f.page, 'editor');
    await f.goto(`/projects/${project.id}/deployments`); await f.page.getByRole('heading', { name: 'Saved version 1', exact: true }).waitFor(); await fits(f.page, 'publishing');
  }
});

test('sign-in, safe callback errors, and 200 percent text sizing preserve usable controls', async (t) => {
  const f = await deploymentsFixture(t, browser, { authenticated: false });
  for (const width of [320, 375, 768, 1280]) {
    await f.page.setViewportSize({ width, height: 1000 });
    await f.goto('/login'); await f.page.getByRole('button', { name: 'Continue with GitHub' }).waitFor(); await fits(f.page, 'login');
    await f.goto('/auth/callback?error=access_denied'); await f.page.getByRole('link', { name: 'Back to sign in' }).waitFor(); await fits(f.page, 'callback');
  }
  await f.goto('/login'); await f.page.getByRole('button', { name: 'Continue with GitHub' }).waitFor();
  await f.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await fits(f.page, 'login-text-zoom');
  await f.page.getByRole('button', { name: 'Continue with GitHub' }).focus();
  assert.ok((await f.page.locator(':focus').innerText()).includes('Continue with GitHub'));
  assert.ok(await f.page.locator(':focus').evaluate((node) => getComputedStyle(node).outlineStyle !== 'none'));
});
