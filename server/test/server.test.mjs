import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import test from 'node:test';
import pino from 'pino';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { startServer } from '../dist/core/server.js';

const databaseUrl = process.env.GITFOLIO_TEST_DATABASE_URL;
const redisUrl = process.env.GITFOLIO_TEST_REDIS_URL;

async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function environment(redis) {
  assert.match(new URL(databaseUrl).pathname.slice(1), /^gitfolio_phase1_test_[a-z0-9_]+$/);
  return EnvironmentSchema.parse({
    NODE_ENV: 'test',
    CLIENT_URL: 'http://localhost:5173',
    SERVER_HOST: '127.0.0.1',
    SERVER_PORT: await unusedPort(),
    DATABASE_URL: databaseUrl,
    REDIS_URL: redis,
    LOG_LEVEL: 'silent',
  });
}

test('startup releases database and Redis clients if a dependency is unavailable', {
  skip: databaseUrl ? false : 'Set GITFOLIO_TEST_DATABASE_URL to a disposable database',
  timeout: 15000,
}, async () => {
  const unavailableRedis = `redis://127.0.0.1:${await unusedPort()}`;
  await assert.rejects(startServer(await environment(unavailableRedis), pino({ level: 'silent' })));
});

test('server starts with real dependencies and closes idempotently', {
  skip: databaseUrl && redisUrl ? false : 'Set disposable database and Redis integration URLs',
  timeout: 15000,
}, async (t) => {
  const runtime = await startServer(await environment(redisUrl), pino({ level: 'silent' }));
  t.after(() => runtime.close());
  const response = await fetch(`http://127.0.0.1:${runtime.server.address().port}/api/health/ready`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
  await Promise.all([runtime.close(), runtime.close()]);
  assert.equal(runtime.server.listening, false);
});
