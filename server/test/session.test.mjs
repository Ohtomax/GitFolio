import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import pino from 'pino';
import { EnvironmentSchema } from '../dist/config/env.schema.js';
import { createSessionService } from '../dist/modules/auth/session.service.js';
import { verifyToken } from '../dist/middleware/auth.js';
import { errorHandler } from '../dist/middleware/error-handler.js';

const environment = EnvironmentSchema.parse({ NODE_ENV: 'test', CLIENT_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://fixture:fixture@localhost/fixture', REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 's'.repeat(32), JWT_EXPIRES_IN: '1h' });

function fixture() {
  const values = new Map();
  const store = { async set(key, userId, seconds) {
    assert.ok(seconds > 0 && seconds <= 3600);
    values.set(key, userId);
  }, async get(key) { return values.get(key) ?? null; }, async delete(key) { values.delete(key); } };
  return { sessions: createSessionService(environment, store), store, values };
}

test('JWT contains only session identifiers, validates signatures and claims, and supports revocation', async () => {
  const { sessions, values } = fixture();
  const userId = randomUUID();
  const issued = await sessions.issue(userId);
  const payload = jwt.decode(issued.token);
  assert.deepEqual(Object.keys(payload).sort(), ['aud', 'exp', 'iat', 'iss', 'jti', 'sub']);
  assert.equal(payload.sub, userId);
  assert.ok(values.keys().next().value.startsWith('auth:session:'));
  const identity = await sessions.verify(issued.token);
  assert.equal(identity.userId, userId);
  assert.equal(identity.expiresAt, issued.expiresAt);
  const changed = issued.token.split('.');
  changed[2] = (changed[2][0] === 'a' ? 'b' : 'a') + changed[2].slice(1);
  await assert.rejects(sessions.verify(changed.join('.')), { code: 'UNAUTHENTICATED' });
  for (const overrides of [{ algorithm: 'HS384' }, { issuer: 'other' }, { audience: 'other' }, { expiresIn: -1 }]) {
    const token = jwt.sign({}, environment.JWT_SECRET, { algorithm: 'HS256', issuer: 'gitfolio', audience: 'gitfolio-client',
      subject: userId, jwtid: payload.jti, expiresIn: '1h', ...overrides });
    await assert.rejects(sessions.verify(token), { code: 'UNAUTHENTICATED' });
  }
  await sessions.revoke(identity);
  await assert.rejects(sessions.verify(issued.token), { code: 'UNAUTHENTICATED' });
});

test('middleware rejects missing or invalid credentials and cookie-authenticated cross-origin mutations', async (t) => {
  const { sessions } = fixture();
  const issued = await sessions.issue(randomUUID());
  const app = express();
  app.use(verifyToken(sessions, environment));
  app.all('/protected', (req, res) => res.json({ userId: req.auth.userId }));
  app.use(errorHandler(pino({ level: 'silent' })));
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/protected`;
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: { Authorization: 'Basic invalid' } })).status, 401);
  assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${issued.token}` } })).status, 200);
  const Cookie = `gitfolio_session=${issued.token}`;
  assert.equal((await fetch(url, { headers: { Cookie } })).status, 200);
  assert.equal((await fetch(url, { headers: { Cookie: `${Cookie}; ${Cookie}` } })).status, 401);
  assert.equal((await fetch(url, { method: 'POST', headers: { Cookie } })).status, 403);
  assert.equal((await fetch(url, { method: 'POST', headers: { Cookie, Origin: environment.CLIENT_URL } })).status, 200);
});

test('session storage failure fails closed', async () => {
  const f = fixture();
  const issued = await f.sessions.issue(randomUUID());
  f.store.get = async () => { throw new Error('redis unavailable'); };
  await assert.rejects(f.sessions.verify(issued.token));
});
