import { ApiErrorSchema } from '@gitfolio/shared';
import { z } from 'zod';
import { useAuthStore } from '../stores/auth.store.ts';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code;
  }
}
const messages: Record<string, string> = {
  UNAUTHENTICATED: 'Your session has ended. Please sign in again.',
  AUTH_NOT_CONFIGURED: 'GitHub sign-in is not available yet. Please try again later.',
  OAUTH_STATE_INVALID: 'This sign-in attempt expired or was already used. Please start again.',
  INVALID_AUTH_REQUEST: 'The sign-in link is incomplete. Please start again.',
  GITHUB_REAUTH_REQUIRED: 'GitHub authorization expired. Please sign in again.',
  GITHUB_UNAVAILABLE: 'GitHub is unavailable right now. Please try again.',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes and try again.',
};
export function isBackendUrl(path: string): boolean {
  if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#')) return false;
  const url = new URL(path, 'https://gitfolio.invalid');
  return url.origin === 'https://gitfolio.invalid' && url.pathname.startsWith('/api/');
}

export async function apiFetch<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  if (!isBackendUrl(path)) throw new ApiError(0, 'INVALID_API_URL', 'The API address is invalid.');
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    response = await fetch(path, { ...init, headers, credentials: 'same-origin', redirect: 'error',
      signal: init.signal ?? AbortSignal.timeout(15000) });
  } catch { throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach GitFolio. Check your connection and try again.'); }
  if (response.status === 401) useAuthStore.getState().clearSession();
  let body: unknown;
  try { body = await response.json(); } catch { throw new ApiError(502, 'INVALID_RESPONSE', 'The server returned an unexpected response.'); }
  const envelope = z.object({ success: z.boolean(), data: z.unknown().optional(), error: ApiErrorSchema.optional() }).safeParse(body);
  if (!envelope.success) throw new ApiError(502, 'INVALID_RESPONSE', 'The server returned an unexpected response.');
  if (!response.ok || !envelope.data.success) {
    const code = envelope.data.error?.code ?? 'REQUEST_FAILED';
    throw new ApiError(response.status, code, messages[code] ?? 'The request could not be completed. Please try again.');
  }
  const result = schema.safeParse(envelope.data.data);
  if (!result.success) throw new ApiError(502, 'INVALID_RESPONSE', 'The server returned an unexpected response.');
  return result.data;
}
