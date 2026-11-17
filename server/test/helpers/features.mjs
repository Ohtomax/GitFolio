import { once } from 'node:events';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { EnvironmentSchema } from '../../dist/config/env.schema.js';
import { createSessionService } from '../../dist/modules/auth/session.service.js';
import { verifyToken } from '../../dist/middleware/auth.js';
import { createApp } from '../../dist/core/app.js';

export async function featureFixture(t, routers) {
  const environment = EnvironmentSchema.parse({ NODE_ENV: 'test', CLIENT_URL: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://fixture:fixture@localhost/fixture', REDIS_URL: 'redis://localhost:6379', JWT_SECRET: 's'.repeat(32) });
  const values = new Map();
  const sessions = createSessionService(environment, { async set(key, id) { values.set(key, id); },
    async get(key) { return values.get(key) ?? null; }, async delete(key) { values.delete(key); } });
  const ownerId = randomUUID();
  const otherId = randomUUID();
  const token = (await sessions.issue(ownerId)).token;
  const otherToken = (await sessions.issue(otherId)).token;
  const app = createApp(environment, { logger: pino({ level: 'silent' }), checkReadiness: async () => {},
    ...routers(verifyToken(sessions, environment), ownerId) });
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, options = {}) => fetch(url + path, { ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } });
  return { url, request, ownerId, otherId, token, otherToken };
}
