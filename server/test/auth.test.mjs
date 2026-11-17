import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import pino from 'pino';
import { AuthSessionSchema } from '@gitfolio/shared';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { getGitHubOAuthConfiguration } from '../dist/config/github-oauth.js';
import { createApp } from '../dist/core/app.js';
import { createAuthRouter } from '../dist/modules/auth/auth.route.js';
import { createAuthService } from '../dist/modules/auth/auth.service.js';
import { createSessionService } from '../dist/modules/auth/session.service.js';
import { createEncryptionService } from '../dist/utils/encryption.js';

async function fixture(t, { failProvider = false, production = false } = {}) {
  const environment = EnvironmentSchema.parse({ NODE_ENV: production ? 'production' : 'test',
    CLIENT_URL: production ? 'https://gitfolio.example' : 'http://localhost:5173',
    DATABASE_URL: 'postgresql://fixture:fixture@localhost/fixture', REDIS_URL: 'redis://localhost:6379',
    GITHUB_CLIENT_ID: 'fixture-client', GITHUB_CLIENT_SECRET: 'fixture-secret',
    JWT_SECRET: 's'.repeat(32), ENCRYPTION_KEY: 'e'.repeat(32) });
  const states = new Map();
  const sessions = new Map();
  let stored;
  let exchanges = 0;
  let profileId = '123';
  const provider = {
    async exchangeCode(code, verifier) {
      exchanges++;
      assert.equal(code, 'fixture-code');
      assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
      if (failProvider) throw new Error('private-provider-error');
      return { access_token: 'fixture-private-access', refresh_token: 'fixture-private-refresh',
        token_type: 'bearer', expires_in: 28800, refresh_token_expires_in: 15897600 };
    },
    async getProfile(token) {
      assert.equal(token, 'fixture-private-access');
      return { id: profileId, login: 'fixture-user', name: 'Private Fixture', email: 'fixture@example.test',
        avatar_url: 'https://avatars.githubusercontent.com/u/123' };
    },
  };
  const repository = {
    async upsertProfile(profile) { stored = { id: stored?.id ?? randomUUID(), ...profile };
      const { id, githubId, login, name, email, avatarUrl } = stored;
      return { id, githubId, login, name, email, avatarUrl };
    },
    async findProfile(id) { if (stored?.id !== id) return null;
      const { githubId, login, name, email, avatarUrl } = stored;
      return { id, githubId, login, name, email, avatarUrl };
    },
  };
  const auth = createAuthService(getGitHubOAuthConfiguration(environment), repository, provider,
    createEncryptionService(environment.ENCRYPTION_KEY), {
      async put(key, value, ttl) { assert.equal(ttl, 600); states.set(key, value); },
      async take(key) { const value = states.get(key) ?? null; states.delete(key); return value; },
    });
  const sessionService = createSessionService(environment, {
    async set(key, id) { sessions.set(key, id); }, async get(key) { return sessions.get(key) ?? null; },
    async delete(key) { sessions.delete(key); },
  });
  const app = createApp(environment, { logger: pino({ level: 'silent' }), checkReadiness: async () => {},
    authRouter: createAuthRouter(environment, auth, sessionService) });
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/api/auth`;
  async function begin() {
    const response = await fetch(`${url}/github`, { redirect: 'manual' });
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get('location'));
    const cookie = response.headers.get('set-cookie');
    return { location, cookie: cookie.split(';')[0], headers: cookie,
      input: { code: 'fixture-code', state: location.searchParams.get('state') } };
  }
  const complete = (attempt, overrides = {}) => fetch(`${url}/github/callback`, { method: 'POST',
    headers: { Origin: environment.CLIENT_URL, 'Content-Type': 'application/json', Cookie: attempt.cookie },
    body: JSON.stringify({ ...attempt.input, ...overrides }) });
  return { url, begin, complete, states, stored: () => stored, exchanges: () => exchanges, environment,
    setProfileId: (id) => { profileId = id; } };
}

test('publishing consent requires a session, adds only needed scopes, and cannot switch the account', async (t) => {
  const f = await fixture(t);
  assert.equal((await fetch(f.url + '/github/publish?format=react', { redirect: 'manual' })).status, 401);
  const session = await f.complete(await f.begin());
  const cookie = session.headers.getSetCookie().find(value => value.startsWith('gitfolio_session=')).split(';')[0];
  const result = await fetch(f.url + '/github/publish?format=react', { redirect: 'manual', headers: { Cookie: cookie } });
  assert.equal(result.status, 302);
  const location = new URL(result.headers.get('location'));
  assert.equal(location.searchParams.get('scope'), 'read:user user:email repo workflow');
  const attempt = { cookie: result.headers.getSetCookie().find(value => value.startsWith('gitfolio_oauth=')).split(';')[0],
    input: { code: 'fixture-code', state: location.searchParams.get('state') } };
  assert.equal(f.states.get(attempt.input.state).publishFor, '123');
  f.setProfileId('999');
  const mismatch = await f.complete(attempt);
  assert.equal(mismatch.status, 403); assert.equal((await mismatch.json()).error.code, 'GITHUB_ACCOUNT_MISMATCH');
  assert.equal(f.stored().githubId, '123');
  const minimal = await fetch(f.url + '/github/publish?format=static', { redirect: 'manual', headers: { Cookie: cookie } });
  assert.equal(new URL(minimal.headers.get('location')).searchParams.get('scope'), 'read:user user:email repo');
});

test('OAuth uses browser-bound, one-time state and S256 PKCE, encrypts data, and returns a revocable session', async (t) => {
  const f = await fixture(t);
  const attempt = await f.begin();
  assert.equal(attempt.location.origin, 'https://github.com');
  assert.equal(attempt.location.searchParams.get('code_challenge_method'), 'S256');
  const saved = f.states.get(attempt.input.state);
  assert.equal(attempt.location.searchParams.get('code_challenge'), createHash('sha256').update(saved.verifier).digest('base64url'));
  assert.equal(attempt.location.searchParams.get('scope'), 'read:user user:email');
  assert.ok(!attempt.location.href.includes('fixture-secret'));
  assert.match(attempt.headers, /HttpOnly/);
  assert.match(attempt.headers, /SameSite=Lax/);
  const response = await f.complete(attempt);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  AuthSessionSchema.parse(body.data);
  assert.equal(body.data.user.name, 'Private Fixture');
  assert.ok(!JSON.stringify(body).includes('fixture-private-'));
  assert.ok(!JSON.stringify(f.stored()).match(/Private Fixture|fixture@example.test|fixture-private-/));
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith('gitfolio_session='));
  assert.match(cookie, /Path=\/api;/);
  assert.match(cookie, /HttpOnly/);
  const headers = { Cookie: cookie.split(';')[0] };
  assert.equal((await fetch(`${f.url}/me`, { headers })).status, 200);
  assert.equal((await f.complete(attempt)).status, 400);
  assert.equal(f.exchanges(), 1);
  const logout = await fetch(`${f.url}/logout`, { method: 'POST', headers: { ...headers, Origin: f.environment.CLIENT_URL } });
  assert.equal(logout.status, 200);
  assert.equal((await fetch(`${f.url}/me`, { headers })).status, 401);
});

test('state cannot be replayed, used by another browser, or accepted after expiration', async (t) => {
  const f = await fixture(t);
  const first = await f.begin();
  const second = await f.begin();
  const mismatch = await f.complete({ ...first, cookie: second.cookie });
  assert.equal(mismatch.status, 400);
  assert.equal((await mismatch.json()).error.code, 'OAUTH_STATE_INVALID');
  assert.equal((await f.complete(first)).status, 400);
  f.states.delete(second.input.state);
  assert.equal((await f.complete(second)).status, 400);
  assert.equal(f.exchanges(), 0);
});

test('callback rejects invalid input before services and consumes failed exchanges', async (t) => {
  const f = await fixture(t, { failProvider: true });
  const attempt = await f.begin();
  for (const override of [{ code: '' }, { state: 'invalid' }, { injected: 'field' }, { code: ['array'] }]) {
    const response = await f.complete(attempt, override);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_AUTH_REQUEST');
  }
  assert.equal(f.exchanges(), 0);
  const failed = await f.complete(attempt);
  assert.equal(failed.status, 500);
  assert.ok(!JSON.stringify(await failed.json()).includes('private-provider-error'));
  assert.equal((await f.complete(attempt)).status, 400);
  assert.equal((await fetch(`${f.url}/me`)).status, 401);
});

test('production auth cookies require HTTPS', async (t) => {
  const f = await fixture(t, { production: true });
  const attempt = await f.begin();
  assert.match(attempt.headers, /Secure/);
  const response = await f.complete(attempt);
  assert.equal(response.status, 200);
  assert.match(response.headers.getSetCookie().find((value) => value.startsWith('gitfolio_session=')), /Secure/);
});

test('unconfigured auth fails safely without exposing a provider redirect', async (t) => {
  const env = EnvironmentSchema.parse({ CLIENT_URL: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://fixture:fixture@localhost/fixture', REDIS_URL: 'redis://localhost:6379' });
  const server = createServer(createApp(env, { logger: pino({ level: 'silent' }), checkReadiness: async () => {} })).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/github`, { redirect: 'manual' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'AUTH_NOT_CONFIGURED');
  assert.equal(response.headers.get('location'), null);
});
