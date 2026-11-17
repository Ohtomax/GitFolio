import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';

const { chromium } = await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE ?? 'playwright');
const baseUrl = process.env.GITFOLIO_BROWSER_BASE_URL ?? 'http://127.0.0.1:5173';
let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }); });
after(async () => { await browser?.close(); });

async function fixture(t, options = {}) {
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(async () => { await context.close(); assert.deepEqual(errors, []); });
  const session = { user: { id: randomUUID(), githubId: '123', login: 'fixture-user', name: 'Fixture Developer',
    email: 'fixture@example.test', avatarUrl: null }, expiresAt: Date.now() + (options.lifetime ?? 3600000) };
  const state = { authenticated: options.authenticated ?? false, unavailable: false, callbacks: 0, ...options };
  const respond = (route, status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  await page.route('**/api/auth/me', async (route) => {
    if (state.waitForSession) await state.waitForSession;
    if (state.unavailable) return respond(route, 503, { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Unavailable.' } });
    const active = state.authenticated && session.expiresAt > Date.now();
    return respond(route, active ? 200 : 401, active ? { success: true, data: session }
      : { success: false, error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
  });
  await page.route('**/api/auth/github/callback', async (route) => {
    state.callbacks++;
    const input = route.request().postDataJSON();
    assert.equal(input.code, 'fixture-code');
    assert.equal(input.state.length, 43);
    if (state.rejectCallback) return respond(route, 400, { success: false,
      error: { code: 'OAUTH_STATE_INVALID', message: 'Expired state.' } });
    state.authenticated = true;
    return respond(route, 200, { success: true, data: session });
  });
  await page.route('**/api/auth/logout', async (route) => {
    state.authenticated = false;
    return respond(route, 200, { success: true, data: null });
  });
  return { page, context, state, session, goto: (path) => page.goto(new URL(path, baseUrl).href) };
}

test('AuthGuard waits for verification and redirects anonymous users without exposing the account page', async (t) => {
  let release;
  const waitForSession = new Promise((resolve) => { release = resolve; });
  const f = await fixture(t, { waitForSession });
  await f.goto('/account?tab=profile');
  await f.page.getByRole('status', { name: 'Loading your session' }).waitFor();
  assert.equal(await f.page.getByRole('heading', { name: /Welcome,/ }).count(), 0);
  release();
  await f.page.waitForURL('**/login');
  await f.page.getByRole('button', { name: 'Continue with GitHub' }).waitFor();
});

test('OAuth completion runs once in StrictMode; session reload and logout update guarded routes', async (t) => {
  const f = await fixture(t);
  await f.goto(`/auth/callback?code=fixture-code&state=${'b'.repeat(43)}`);
  await f.page.waitForURL('**/account');
  await f.page.getByRole('heading', { name: 'Welcome, Fixture Developer.' }).waitFor();
  assert.equal(f.state.callbacks, 1);
  assert.equal(new URL(f.page.url()).search, '');
  const storage = await f.page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert.ok(!JSON.stringify(storage).match(/token|fixture-code|Fixture Developer|fixture@example/));
  await f.page.reload();
  await f.page.getByRole('heading', { name: 'Welcome, Fixture Developer.' }).waitFor();
  await f.page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await f.page.waitForURL('**/login');
  assert.equal(await f.page.getByRole('heading', { name: /Welcome,/ }).count(), 0);
  await f.goto('/account');
  await f.page.waitForURL('**/login');
});

test('denied and incomplete callbacks show safe recovery and remove sensitive query strings', async (t) => {
  const f = await fixture(t);
  await f.goto('/auth/callback?error=access_denied&error_description=private-provider-details');
  await f.page.getByText(/GitHub sign-in was cancelled/).waitFor();
  assert.equal(new URL(f.page.url()).search, '');
  assert.ok(!(await f.page.locator('body').innerText()).includes('private-provider-details'));
  await f.page.getByRole('link', { name: 'Back to sign in' }).click();
  await f.page.waitForURL('**/login');
  await f.goto('/auth/callback?code=fixture-code');
  await f.page.getByText(/sign-in link is incomplete/).waitFor();
  assert.equal(new URL(f.page.url()).search, '');
  assert.equal(f.state.callbacks, 0);
});

test('expired state is not retried automatically', async (t) => {
  const f = await fixture(t, { rejectCallback: true });
  await f.goto(`/auth/callback?code=fixture-code&state=${'c'.repeat(43)}`);
  await f.page.getByText(/sign-in attempt expired/).waitFor();
  assert.equal(f.state.callbacks, 1);
  assert.equal(new URL(f.page.url()).search, '');
});

test('AuthGuard shows an outage recovery state and verifies again before exposing account content', async (t) => {
  const f = await fixture(t, { authenticated: true, unavailable: true });
  await f.goto('/account');
  await f.page.getByRole('heading', { name: 'We couldn’t check your session.' }).waitFor();
  assert.equal(new URL(f.page.url()).pathname, '/account');
  assert.equal(await f.page.getByRole('heading', { name: /Welcome,/ }).count(), 0);
  f.state.unavailable = false;
  await f.page.getByRole('button', { name: 'Try again' }).click();
  await f.page.getByRole('heading', { name: 'Welcome, Fixture Developer.' }).waitFor();
});

test('AuthGuard redirects when the verified session expires', async (t) => {
  const f = await fixture(t, { authenticated: true, lifetime: 2500 });
  await f.goto('/account');
  await f.page.getByRole('heading', { name: 'Welcome, Fixture Developer.' }).waitFor();
  await f.page.waitForURL('**/login', { timeout: 10000 });
  assert.equal(await f.page.getByRole('heading', { name: /Welcome,/ }).count(), 0);
});

test('the mobile sign-in page fits the viewport and exposes accessible sign-in controls', async (t) => {
  const f = await fixture(t, { viewport: { width: 390, height: 844 } });
  await f.goto('/login');
  const button = f.page.getByRole('button', { name: 'Continue with GitHub' });
  await button.waitFor();
  assert.equal(await button.isEnabled(), true);
  assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
});
