import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { getGitHubOAuthConfiguration } from '../dist/config/github-oauth.js';

const foundation = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://gitfolio:gitfolio@127.0.0.1:5433/gitfolio_dev',
  REDIS_URL: 'redis://127.0.0.1:6379',
  CLIENT_URL: 'http://localhost:5173',
};
const credentials = { GITHUB_CLIENT_ID: 'fixture-client-id', GITHUB_CLIENT_SECRET: 'fixture-client-secret' };

test('unconfigured OAuth stays optional, while partial credentials are rejected', () => {
  assert.equal(getGitHubOAuthConfiguration(EnvironmentSchema.parse(foundation)), null);
  for (const partial of [
    { GITHUB_CLIENT_ID: credentials.GITHUB_CLIENT_ID },
    { GITHUB_CLIENT_SECRET: credentials.GITHUB_CLIENT_SECRET },
  ]) {
    assert.equal(EnvironmentSchema.safeParse({ ...foundation, ...partial }).success, false);
  }
});

test('OAuth configuration derives the frontend callback and uses read-only sign-in scopes', () => {
  const configuration = getGitHubOAuthConfiguration(EnvironmentSchema.parse({ ...foundation, ...credentials }));
  assert.equal(configuration.callbackUrl, 'http://localhost:5173/auth/callback');
  assert.equal(configuration.authorizationUrl, 'https://github.com/login/oauth/authorize');
  assert.equal(configuration.tokenUrl, 'https://github.com/login/oauth/access_token');
  assert.deepEqual(configuration.scopes, ['read:user', 'user:email']);
});

test('callbacks must use the exact frontend origin and callback path without embedded data', () => {
  for (const callback of [
    'https://untrusted.example/auth/callback',
    'http://localhost:5174/auth/callback',
    'http://127.0.0.1:5173/auth/callback',
    'http://localhost:5173/api/auth/github/callback',
    'http://localhost:5173/auth/callback?code=private-code',
    'http://localhost:5173/auth/callback#fragment',
    'http://user:password@localhost:5173/auth/callback',
    'invalid-url',
  ]) {
    assert.equal(EnvironmentSchema.safeParse({
      ...foundation, ...credentials, GITHUB_CALLBACK_URL: callback,
    }).success, false);
  }
});

test('production and non-loopback OAuth callbacks require HTTPS', () => {
  assert.equal(EnvironmentSchema.safeParse({
    ...foundation, ...credentials, NODE_ENV: 'production',
  }).success, false);
  assert.equal(EnvironmentSchema.safeParse({
    ...foundation, ...credentials, CLIENT_URL: 'http://gitfolio.example',
  }).success, false);
  assert.equal(EnvironmentSchema.safeParse({
    ...foundation, ...credentials, NODE_ENV: 'production', CLIENT_URL: 'https://gitfolio.example',
  }).success, true);
});

test('the configuration check reports status without echoing either credential', () => {
  const result = spawnSync(process.execPath, ['scripts/check-github-oauth.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, ...foundation, ...credentials, GITHUB_CALLBACK_URL: 'http://localhost:5173/auth/callback' },
    encoding: 'utf8',
    timeout: 10000,
  });
  const output = result.stdout + result.stderr;
  assert.equal(result.status, 0);
  assert.match(output, /Local GitHub OAuth configuration is valid/);
  assert.doesNotMatch(output, /fixture-client-id|fixture-client-secret/);
});

test('invalid OAuth settings report field names without echoing credentials or callback data', () => {
  const result = spawnSync(process.execPath, ['scripts/check-github-oauth.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: {
      ...process.env, ...foundation, ...credentials,
      GITHUB_CALLBACK_URL: 'https://untrusted.example/auth/callback?code=private-code',
    },
    encoding: 'utf8',
    timeout: 10000,
  });
  const output = result.stdout + result.stderr;
  assert.equal(result.status, 1);
  assert.match(output, /GITHUB_CALLBACK_URL/);
  assert.doesNotMatch(output, /fixture-client-id|fixture-client-secret|private-code|untrusted\.example/);
});

test('structured logs redact OAuth client secrets in configuration and environment objects', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { createLogger } from './dist/utils/logger.js';
    createLogger().info({
      clientSecret: 'fixture-private-secret',
      GITHUB_CLIENT_SECRET: 'fixture-private-secret',
      configuration: { clientSecret: 'fixture-private-secret' },
      environment: { GITHUB_CLIENT_SECRET: 'fixture-private-secret' },
    }, 'OAuth redaction fixture');
  `], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout + result.stderr, /fixture-private-secret/);
  const entry = JSON.parse(result.stdout);
  assert.equal(entry.clientSecret, '[REDACTED]');
  assert.equal(entry.GITHUB_CLIENT_SECRET, '[REDACTED]');
  assert.equal(entry.configuration.clientSecret, '[REDACTED]');
  assert.equal(entry.environment.GITHUB_CLIENT_SECRET, '[REDACTED]');
});
