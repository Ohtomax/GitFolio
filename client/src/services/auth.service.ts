import { AuthSessionSchema, OAuthCallbackSchema, type AuthSession, type OAuthCallback } from '@gitfolio/shared';
import { z } from 'zod';
import { apiFetch } from './api.ts';

// StrictMode and remounts may request the same one-time callback more than once.
let pendingCallback: { state: string; request: Promise<AuthSession> } | undefined;
export const authService = {
  getSession: () => apiFetch('/api/auth/me', AuthSessionSchema),
  completeOAuth(input: OAuthCallback): Promise<AuthSession> {
    const callback = OAuthCallbackSchema.parse(input);
    if (pendingCallback?.state === callback.state) return pendingCallback.request;
    const request = apiFetch('/api/auth/github/callback', AuthSessionSchema, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(callback) });
    pendingCallback = { state: callback.state, request };
    return request;
  },
  logout: () => apiFetch('/api/auth/logout', z.null(), { method: 'POST' }),
};
