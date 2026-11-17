import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthStore } from '../src/stores/auth.store.ts';
import { apiFetch, isBackendUrl } from '../src/services/api.ts';
import { authService } from '../src/services/auth.service.ts';
import { sessionKey, sessionQueryOptions } from '../src/hooks/useAuth.ts';

const session = { user: { id: randomUUID(), githubId: '123', login: 'fixture-user',
  name: 'Fixture', email: null, avatarUrl: null }, expiresAt: Date.now() + 3600000 };
test.beforeEach(() => useAuthStore.getState().clearSession());

test('the auth store clears expired sessions and never stores browser credentials', () => {
  useAuthStore.getState().setSession(session);
  assert.equal(useAuthStore.getState().status, 'authenticated');
  assert.equal(useAuthStore.getState().user?.id, session.user.id);
  assert.ok(!('token' in useAuthStore.getState()));
  useAuthStore.getState().setSession({ ...session, expiresAt: Date.now() - 1 });
  assert.equal(useAuthStore.getState().status, 'anonymous');
  assert.equal(useAuthStore.getState().user, null);
});

test('apiFetch restricts requests to the API and uses cookies without exposing tokens', async (t) => {
  for (const path of ['https://evil.example/api/auth/me', '//evil.example/api/me', '/api/../private', '/api/\\evil', '/api/auth/me#secret']) {
    assert.equal(isBackendUrl(path), false);
    await assert.rejects(apiFetch(path, z.null()), { code: 'INVALID_API_URL' });
  }
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    assert.equal(path, '/api/auth/me');
    assert.equal(init?.credentials, 'same-origin');
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).get('Authorization'), null);
    return Response.json({ success: true, data: session });
  });
  assert.deepEqual(await authService.getSession(), session);
});

test('401 and service outages clear stale user data and remain distinguishable', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  useAuthStore.getState().setSession(session);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false,
    error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } }, { status: 401 }));
  assert.equal(await queryClient.fetchQuery(sessionQueryOptions), null);
  assert.equal(useAuthStore.getState().status, 'anonymous');
  assert.equal(queryClient.getQueryData(sessionKey), null);
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private-network-details'); });
  await queryClient.invalidateQueries({ queryKey: sessionKey, refetchType: 'none' });
  await assert.rejects(queryClient.fetchQuery(sessionQueryOptions), { code: 'NETWORK_ERROR' });
  assert.equal(useAuthStore.getState().status, 'unavailable');
});

test('duplicate OAuth completions share one request instead of replaying one-time codes', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return Response.json({ success: true, data: session }); });
  const callback = { code: 'fixture-code', state: 'a'.repeat(43) };
  const first = authService.completeOAuth(callback);
  const second = authService.completeOAuth(callback);
  assert.equal(first, second);
  assert.deepEqual(await first, session);
  assert.equal(requests, 1);
});

test('cancelling an old session check cannot overwrite a newly accepted login', async (t) => {
  const queryClient = new QueryClient();
  t.after(() => queryClient.clear());
  t.mock.method(globalThis, 'fetch', (_path, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const pending = queryClient.fetchQuery(sessionQueryOptions);
  const rejected = assert.rejects(pending);
  await queryClient.cancelQueries({ queryKey: sessionKey });
  useAuthStore.getState().setSession(session);
  await rejected;
  assert.equal(useAuthStore.getState().status, 'authenticated');
  assert.equal(useAuthStore.getState().user?.id, session.user.id);
});

test('malformed and HTML error responses do not expose server details', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>private-error</html>', { status: 502 }));
  await assert.rejects(authService.getSession(), { code: 'INVALID_RESPONSE', message: 'The server returned an unexpected response.' });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: { token: 'private-token' } }));
  await assert.rejects(authService.getSession(), { code: 'INVALID_RESPONSE' });
});
