import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { EnvironmentSchema } from '../dist/config/env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://gitfolio:gitfolio@127.0.0.1:5432/gitfolio_dev',
  REDIS_URL: 'redis://127.0.0.1:6379',
  CLIENT_URL: 'http://localhost:5173/',
};

test('foundation configuration works without future OAuth credentials', () => {
  const environment = EnvironmentSchema.parse({ ...valid, JWT_SECRET: '', ENCRYPTION_KEY: '' });
  assert.equal(environment.SERVER_PORT, 3001);
  assert.equal(environment.CLIENT_URL, 'http://localhost:5173');
  assert.equal(environment.JWT_SECRET, undefined);
  assert.equal(environment.ENCRYPTION_KEY, undefined);
});

test('uses PORT from platform environment when SERVER_PORT is omitted', () => {
  const originalPort = process.env.PORT;
  try {
    process.env.PORT = '10000';
    const environment = EnvironmentSchema.parse({ ...valid });
    assert.equal(environment.SERVER_PORT, 10000);
  } finally {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
  }
});

test('rejects malformed service URLs, wrong protocols, and invalid ports', () => {
  for (const override of [
    { DATABASE_URL: undefined }, { DATABASE_URL: 'invalid-url' },
    { DATABASE_URL: 'https://example.com' }, { REDIS_URL: 'http://localhost:6379' },
    { CLIENT_URL: 'invalid-url' }, { CLIENT_URL: 'http://localhost:5173/a/path' },
    { CLIENT_URL: 'http://user:password@localhost:5173' },
    { SERVER_PORT: '0' }, { SERVER_PORT: '65536' }, { SERVER_PORT: 'NaN' },
    { API_RATE_LIMIT_MAX: '0' }, { API_RATE_LIMIT_WINDOW_MS: '-1' },
  ]) {
    assert.equal(EnvironmentSchema.safeParse({ ...valid, ...override }).success, false);
  }
});

test('validates supplied JWT secrets and encryption keys by byte length', () => {
  assert.equal(EnvironmentSchema.safeParse({ ...valid, JWT_SECRET: 'short' }).success, false);
  assert.equal(EnvironmentSchema.safeParse({ ...valid, ENCRYPTION_KEY: 'é'.repeat(32) }).success, false);
  assert.equal(EnvironmentSchema.safeParse({
    ...valid, JWT_SECRET: 'a'.repeat(32), ENCRYPTION_KEY: 'é'.repeat(16),
  }).success, true);
});

test('invalid configuration exits before listening and logs variable names without values', () => {
  const secret = 'sensitive-value-that-must-never-be-logged';
  const result = spawnSync(process.execPath, ['dist/index.js'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, ...valid, DATABASE_URL: secret },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /DATABASE_URL/);
  assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secret));
  assert.doesNotMatch(result.stdout, /API is listening/);
});
