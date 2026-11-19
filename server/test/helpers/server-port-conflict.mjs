import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import pino from 'pino';
import { EnvironmentSchema } from '../../dist/config/env.schema.js';
import { startServer } from '../../dist/core/server.js';

assert.match(new URL(process.env.GITFOLIO_TEST_DATABASE_URL).pathname.slice(1), /^gitfolio_phase1_test_[a-z0-9_]+$/);
const occupied = createServer().listen(0, '127.0.0.1');
await once(occupied, 'listening');
try {
  const environment = EnvironmentSchema.parse({ NODE_ENV: 'test', CLIENT_URL: 'http://localhost:5173', SERVER_HOST: '127.0.0.1',
    SERVER_PORT: occupied.address().port, DATABASE_URL: process.env.GITFOLIO_TEST_DATABASE_URL,
    REDIS_URL: process.env.GITFOLIO_TEST_REDIS_URL, LOG_LEVEL: 'silent' });
  for (let attempt = 0; attempt < 10; attempt++) {
    await assert.rejects(startServer(environment, pino({ level: 'silent' })), { code: 'EADDRINUSE' });
    await delay(25);
  }
} finally { await new Promise((resolve) => occupied.close(resolve)); }
console.log('Repeated occupied-port startups released their connections and preserved EADDRINUSE.');
