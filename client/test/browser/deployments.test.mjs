import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { projectFixtureData } from './helpers/projects.mjs';
import { advanceDeployment, deploymentFixtureData, deploymentsFixture } from './helpers/deployments.mjs';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

test('publishing reviews the public target, polls progress, exposes only a confirmed live link, and stops polling', async (t) => {
  const project = projectFixtureData('Publishing');
  const f = await deploymentsFixture(t, browser, { projects: [project] });
  await f.goto('/dashboard');
  await f.page.getByRole('link', { name: 'Deployments for Publishing', exact: true }).click();
  await f.page.getByRole('heading', { name: 'Publish your work.', exact: true }).waitFor();
  const publish = f.page.getByRole('button', { name: 'Publish portfolio', exact: true });
  f.page.once('dialog', dialog => dialog.dismiss()); await publish.click(); assert.equal(f.state.deployCreates, 0);
  f.page.once('dialog', dialog => { assert.match(dialog.message(), /public repository fixture-user\/gitfolio-publishing/); return dialog.accept(); });
  await publish.click();
  const status = f.page.getByRole('status', { name: 'Deployment progress', exact: true });
  await status.filter({ hasText: 'Queued' }).waitFor();
  assert.equal(f.state.deployCreates, 1); assert.equal(f.state.deployBodies[0].repositoryName, 'gitfolio-publishing');
  assert.equal(f.state.deployBodies[0].editorRevision, 0);
  assert.equal(await f.page.getByRole('link', { name: 'Open portfolio', exact: true }).count(), 0);
  advanceDeployment(f.state.deployments[0], 'DEPLOYING'); await status.filter({ hasText: 'Publishing' }).waitFor();
  assert.equal(await f.page.getByRole('link', { name: 'Open portfolio', exact: true }).count(), 0);
  advanceDeployment(f.state.deployments[0], 'LIVE');
  const live = f.page.getByRole('link', { name: 'Open portfolio', exact: true }); await live.waitFor();
  assert.equal(await live.getAttribute('href'), 'https://fixture-user.github.io/gitfolio-publishing/');
  assert.equal(await live.getAttribute('rel'), 'noopener noreferrer');
  await f.page.waitForTimeout(700); const requests = f.state.statusRequests;
  await f.page.waitForTimeout(3500); assert.equal(f.state.statusRequests, requests);
});

test('publishing requests separate React permissions and preserves a safe return destination', async (t) => {
  const project = projectFixtureData('React publishing', 1);
  const f = await deploymentsFixture(t, browser, { projects: [project], publishAuthorized: false });
  await f.goto(`/projects/${project.id}/deployments`);
  await f.page.getByText(/permission also includes private repositories/).waitFor();
  assert.equal(await f.page.getByRole('button', { name: 'Publish portfolio', exact: true }).isDisabled(), true);
  await f.page.getByRole('button', { name: 'Authorize publishing', exact: true }).click();
  await f.page.waitForURL('**/api/auth/github/publish?format=react');
  assert.equal(await f.page.evaluate(() => sessionStorage.getItem('gitfolio_return_to')), `/projects/${project.id}/deployments`);
  assert.equal(f.state.deployCreates, 0); assert.equal(f.state.authorizationRequests.length, 1);
});

test('failed history renders escaped logs and starts a new attempt without changing the old record', async (t) => {
  const project = projectFixtureData('Failed publish', 1), failed = deploymentFixtureData(project, 'FAILED');
  const hostile = '<img src=x onerror="window.logXss=true">'; failed.logs[0].message = hostile;
  const f = await deploymentsFixture(t, browser, { projects: [project], deployments: [failed] });
  await f.goto(`/projects/${project.id}/deployments`);
  const logs = f.page.getByRole('list', { name: 'Deployment logs', exact: true }); await logs.getByText(hostile, { exact: true }).waitFor();
  assert.equal(await logs.locator('img').count(), 0); assert.equal(await f.page.evaluate(() => window.logXss), undefined);
  await f.page.getByRole('link', { name: 'Open build details', exact: true }).waitFor();
  f.page.once('dialog', dialog => dialog.accept()); await f.page.getByRole('button', { name: 'Publish portfolio', exact: true }).click();
  await f.page.getByRole('status', { name: 'Deployment progress', exact: true }).filter({ hasText: 'Queued' }).waitFor();
  assert.equal(f.state.deployments.length, 2); assert.equal(f.state.deployments[1].status, 'FAILED');
});

test('retrying a lost publish acknowledgement reuses the request and creates only one deployment', async (t) => {
  const project = projectFixtureData('Lost publish response');
  const f = await deploymentsFixture(t, browser, { projects: [project], loseDeployResponseOnce: true });
  await f.goto(`/projects/${project.id}/deployments`);
  f.page.once('dialog', dialog => dialog.accept()); await f.page.getByRole('button', { name: 'Publish portfolio', exact: true }).click();
  const retry = f.page.getByRole('button', { name: 'Retry publish request', exact: true }); await retry.waitFor();
  f.page.once('dialog', dialog => dialog.accept()); await retry.click();
  await f.page.getByRole('status', { name: 'Deployment progress', exact: true }).filter({ hasText: 'Queued' }).waitFor();
  assert.equal(f.state.deployRequests, 2); assert.equal(f.state.deployCreates, 1);
  assert.equal(f.state.deployBodies[0].requestId, f.state.deployBodies[1].requestId);
});

test('history paginates on the server, archived projects cannot publish, and the workspace fits 320px', async (t) => {
  const project = { ...projectFixtureData('Archived history'), name: 'P'.repeat(100), repoName: 'r'.repeat(100), status: 'ARCHIVED' };
  const deployments = Array.from({ length: 9 }, (_, index) => deploymentFixtureData(project, 'LIVE', index));
  const f = await deploymentsFixture(t, browser, { projects: [project], deployments });
  await f.goto(`/projects/${project.id}/deployments`);
  const list = f.page.getByRole('list', { name: 'Deployment history', exact: true }); await list.waitFor();
  assert.equal(await list.getByRole('button').count(), 6);
  assert.equal(await f.page.getByRole('button', { name: 'Publish portfolio', exact: true }).isDisabled(), true);
  await f.page.getByRole('button', { name: 'Next', exact: true }).click(); await f.page.getByText('Page 2 of 2', { exact: true }).waitFor();
  assert.equal(await list.getByRole('button').count(), 3);
  await f.page.setViewportSize({ width: 320, height: 900 });
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('history/settings/status failures preserve the workspace and offer recovery', async (t) => {
  const project = projectFixtureData('Recovery'), deployment = deploymentFixtureData(project, 'DEPLOYING');
  const f = await deploymentsFixture(t, browser, { projects: [project], deployments: [deployment], failCapability: true, failHistory: true });
  await f.goto(`/projects/${project.id}/deployments`);
  await f.page.getByRole('button', { name: 'Reload publishing settings', exact: true }).waitFor();
  f.state.failCapability = false; f.state.failHistory = false; f.state.failStatus = true;
  await f.page.getByRole('button', { name: 'Reload publishing settings', exact: true }).click();
  await f.page.getByRole('button', { name: 'Reload history', exact: true }).click();
  const retry = f.page.getByRole('button', { name: 'Retry status', exact: true }); await retry.waitFor();
  f.state.failStatus = false; await retry.click();
  await f.page.getByRole('status', { name: 'Deployment progress', exact: true }).filter({ hasText: 'Publishing' }).waitFor();
});

test('deployment pages guard invalid/anonymous links and hide details after a session expires', async (t) => {
  const anonymous = await deploymentsFixture(t, browser, { authenticated: false });
  await anonymous.goto('/projects/11111111-1111-4111-8111-111111111111/deployments'); await anonymous.page.waitForURL('**/login');
  assert.equal(anonymous.state.projectRequests, 0);
  const project = projectFixtureData('Guarded publish'), pending = deploymentFixtureData(project);
  const f = await deploymentsFixture(t, browser, { projects: [project], deployments: [pending] });
  await f.goto('/projects/invalid/deployments'); await f.page.getByRole('heading', { name: 'This project link is invalid.', exact: true }).waitFor();
  assert.equal(f.state.projectRequests, 0);
  await f.goto(`/projects/${project.id}/deployments`); await f.page.getByRole('heading', { name: 'Deployment history', exact: true }).waitFor();
  f.state.statusUnauthenticated = true; await f.page.waitForURL('**/login', { timeout: 10000 });
  assert.equal(await f.page.getByRole('heading', { name: 'Deployment history', exact: true }).count(), 0);
});
