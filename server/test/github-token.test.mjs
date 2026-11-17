import assert from 'node:assert/strict';
import test from 'node:test';
import { createEncryptionService } from '../dist/utils/encryption.js';
import { createGitHubProvider } from '../dist/providers/github.js';
import { createGitHubTokenService, encryptGitHubTokens } from '../dist/modules/auth/github-token.service.js';

const encryption = createEncryptionService('a'.repeat(32));
const now = 1700000000000;
const initial = { access_token: 'fixture-old-access', refresh_token: 'fixture-old-refresh',
  expires_in: 10, refresh_token_expires_in: 3600, token_type: 'bearer', scope: 'read:user,user:email' };
const rotated = { ...initial, access_token: 'fixture-new-access', refresh_token: 'fixture-new-refresh', expires_in: 28800 };

function fixture(tokens = initial, overrides = {}) {
  let stored = { id: 'fixture-user', githubId: '123', ...encryptGitHubTokens('123', tokens, encryption, now) };
  let pending = Promise.resolve();
  let refreshes = 0;
  const repository = { withLockedCredentials(_id, action) {
    const result = pending.then(() => action(stored, async (update) => { stored = { ...stored, ...update }; }));
    pending = result.catch(() => {});
    return result;
  } };
  const provider = { async refreshToken(value) {
    refreshes++;
    assert.equal(value, initial.refresh_token);
    return rotated;
  }, ...overrides };
  return { service: createGitHubTokenService(repository, provider, encryption, () => now),
    stored: () => stored, refreshes: () => refreshes };
}

test('non-expiring and unexpired GitHub tokens are decrypted without refreshing', async () => {
  for (const tokens of [{ access_token: 'fixture-access', token_type: 'bearer' }, { ...initial, expires_in: 300 }]) {
    const f = fixture(tokens);
    assert.equal(await f.service.getAccessToken('fixture-user'), tokens.access_token);
    assert.equal(f.refreshes(), 0);
  }
});

test('concurrent requests rotate once and persist both encrypted tokens and lifetimes', async () => {
  const f = fixture();
  const values = await Promise.all(Array.from({ length: 5 }, () => f.service.getAccessToken('fixture-user')));
  assert.deepEqual(values, Array(5).fill(rotated.access_token));
  assert.equal(f.refreshes(), 1);
  const stored = f.stored();
  assert.equal(encryption.decrypt(stored.encryptedRefreshToken, 'github:123:refresh'), rotated.refresh_token);
  assert.equal(stored.accessTokenExpiresAt.getTime(), now + rotated.expires_in * 1000);
  assert.equal(stored.refreshTokenExpiresAt.getTime(), now + rotated.refresh_token_expires_in * 1000);
  assert.ok(!JSON.stringify(stored).includes('fixture-new-'));
});

test('expired/missing refresh tokens require sign-in and provider failures preserve saved credentials', async () => {
  for (const tokens of [{ ...initial, refresh_token_expires_in: undefined, refresh_token: undefined },
    { ...initial, refresh_token_expires_in: -1 }]) {
    const f = fixture(tokens);
    await assert.rejects(f.service.getAccessToken('fixture-user'), { code: 'GITHUB_REAUTH_REQUIRED' });
    assert.equal(f.refreshes(), 0);
  }
  const f = fixture(initial, { async refreshToken() { throw new Error('provider unavailable'); } });
  const before = f.stored();
  await assert.rejects(f.service.getAccessToken('fixture-user'));
  assert.deepEqual(f.stored(), before);
  const invalid = fixture(initial, { async refreshToken() { return { ...rotated, refresh_token: undefined }; } });
  await assert.rejects(invalid.service.getAccessToken('fixture-user'), { code: 'GITHUB_INVALID_RESPONSE' });
});

test('GitHub provider uses server credentials and handles refresh errors without leaking responses', async () => {
  const configuration = { clientId: 'fixture-client', clientSecret: 'fixture-secret',
    callbackUrl: 'http://localhost:5173/auth/callback', tokenUrl: 'https://github.com/login/oauth/access_token' };
  const requests = [];
  const provider = createGitHubProvider(configuration, async (url, init) => {
    requests.push({ url, init });
    return Response.json(rotated);
  });
  assert.deepEqual(await provider.refreshToken('fixture-refresh'), rotated);
  assert.equal(requests[0].init.body.get('grant_type'), 'refresh_token');
  assert.equal(requests[0].init.body.get('client_secret'), configuration.clientSecret);
  assert.equal(requests[0].init.body.get('refresh_token'), 'fixture-refresh');
  assert.equal(requests[0].init.redirect, 'error');
  await provider.exchangeCode('fixture-code', 'fixture-verifier');
  assert.equal(requests[1].init.body.get('code_verifier'), 'fixture-verifier');
  assert.equal(requests[1].init.body.get('redirect_uri'), configuration.callbackUrl);
  const rejected = createGitHubProvider(configuration, async () => Response.json({
    error: 'bad_refresh_token', error_description: 'private-provider-message',
  }, { status: 400 }));
  await assert.rejects(rejected.refreshToken('fixture-refresh'), (error) => {
    assert.equal(error.code, 'GITHUB_REAUTH_REQUIRED');
    assert.ok(!error.message.includes('private'));
    return true;
  });
});
