import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import test from 'node:test';
import express from 'express';
import pino from 'pino';
import { HealthResponseSchema } from '@gitfolio/shared';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { createApp } from '../dist/core/app.js';
import { errorHandler } from '../dist/middleware/error-handler.js';

function environment(overrides = {}) {
  return EnvironmentSchema.parse({
    NODE_ENV: 'test',
    CLIENT_URL: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://gitfolio:gitfolio@127.0.0.1:5432/gitfolio_dev',
    REDIS_URL: 'redis://127.0.0.1:6379',
    ...overrides,
  });
}

async function listen(t, app) {
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    const closed = new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    server.closeAllConnections();
    await closed;
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function fixture(t, overrides = {}, checkReadiness = async () => {}) {
  let output = '';
  const logger = pino(new Writable({
    write(chunk, _encoding, callback) { output += chunk.toString(); callback(); },
  }));
  const app = createApp(environment(overrides), { logger, checkReadiness });
  return { url: await listen(t, app), logs: () => output };
}

test('liveness returns the shared contract with security and cache headers', async (t) => {
  const { url } = await fixture(t);
  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(HealthResponseSchema.parse(await response.json()), {
    success: true, data: { status: 'ok' },
  });
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(response.headers.get('content-security-policy'));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('x-request-id'), /^[\da-f-]{36}$/);
});

test('readiness checks dependencies and reports outages without exposing connection details', async (t) => {
  let available = true;
  let calls = 0;
  const { url } = await fixture(t, {}, async () => {
    calls++;
    if (!available) throw new Error('postgresql://private:secret@database/internal');
  });

  assert.equal((await fetch(`${url}/api/health/ready`)).status, 200);
  available = false;
  const response = await fetch(`${url}/api/health/ready`);
  assert.equal(response.status, 503);
  assert.deepEqual(HealthResponseSchema.parse(await response.json()), {
    success: false,
    error: { code: 'SERVICE_UNAVAILABLE', message: 'Required services are unavailable.' },
  });
  assert.equal((await fetch(`${url}/api/health`)).status, 200);
  assert.equal(calls, 2);
});

test('CORS permits the configured client and rejects other origins', async (t) => {
  const { url } = await fixture(t);
  const allowed = await fetch(`${url}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const preflight = await fetch(`${url}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/);

  const denied = await fetch(`${url}/api/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal((await denied.json()).error.code, 'ORIGIN_NOT_ALLOWED');
});

test('unknown endpoints, malformed JSON, and oversized bodies use safe JSON errors', async (t) => {
  const { url } = await fixture(t);
  const missing = await fetch(`${url}/api/unknown-sensitive-path`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');

  const malformed = await fetch(`${url}/api/unknown`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"secret":',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, 'INVALID_JSON');

  const oversized = await fetch(`${url}/api/unknown`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(1024 * 1024) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('API rate limiting returns a consistent 429 envelope and retry headers', async (t) => {
  const { url } = await fixture(t, { API_RATE_LIMIT_MAX: 1 });
  assert.equal((await fetch(`${url}/api/unknown`)).status, 404);
  const limited = await fetch(`${url}/api/health`);
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get('retry-after'));
  assert.ok(limited.headers.get('ratelimit'));
  assert.equal((await limited.json()).error.code, 'RATE_LIMITED');
});

test('request logging omits tokens, request data, and URLs', async (t) => {
  const { url, logs } = await fixture(t);
  const response = await fetch(`${url}/api/private-path?code=private-oauth-code`, {
    method: 'POST',
    headers: { Authorization: 'Bearer private-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'private-personal-name' }),
  });
  await response.json();
  assert.match(logs(), /HTTP request completed/);
  assert.match(logs(), new RegExp(response.headers.get('x-request-id')));
  assert.doesNotMatch(logs(), /private-path|private-oauth-code|private-token|private-personal-name/);
});

test('unexpected errors do not expose internal messages or stack traces', async (t) => {
  const logger = pino({ level: 'silent' });
  const app = express();
  app.use(() => { throw new Error('private-internal-database-error'); });
  app.use(errorHandler(logger));
  const url = await listen(t, app);
  const response = await fetch(url);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
});
