import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOAuthCallback, safeReturnTo } from '../src/utils/auth-navigation.ts';

test('OAuth callback parses one code/state pair and handles denial without trusting provider messages', () => {
  const state = 'a'.repeat(43);
  assert.deepEqual(parseOAuthCallback(`?code=fixture-code&state=${state}`), { input: { code: 'fixture-code', state }, error: null });
  for (const search of ['', '?code=x', `?code=x&code=y&state=${state}`, `?code=x&state=${state}&state=${state}`, '?error=access_denied&error_description=private-provider-message']) {
    const result = parseOAuthCallback(search);
    assert.equal(result.input, null);
    assert.ok(result.error);
    assert.ok(!result.error.includes('private-provider-message'));
  }
});

test('post-login navigation accepts only internal protected routes', () => {
  assert.equal(safeReturnTo('/account'), '/account');
  assert.equal(safeReturnTo('/projects/fixture/edit?tab=theme'), '/projects/fixture/edit?tab=theme');
  for (const value of [null, {}, 'https://evil.example', '//evil.example', '/\\evil.example', '/auth/callback?code=x', '/login', '/projects/../../login', '/account\n']) {
    assert.equal(safeReturnTo(value), '/dashboard');
  }
});
