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
  PROJECT_SLUG_TAKEN: 'You already have a project with this slug. Choose another one.',
  PROJECT_NOT_FOUND: 'This project could not be found.',
  TEMPLATE_NOT_FOUND: 'This template is no longer available. Choose another one.',
  TEMPLATES_UNAVAILABLE: 'Templates are temporarily unavailable. Please try again.',
  PROJECT_UNAVAILABLE: 'This project is temporarily unavailable. Please try again.',
  INVALID_PROJECT_REQUEST: 'Check the project fields and try again.',
  INVALID_TEMPLATE_REQUEST: 'Check the template selection and filters.',
  PROJECT_CONFLICT: 'The project changed while saving. Refresh and try again.',
  EDITOR_CONFLICT: 'A newer version was saved elsewhere. Reload the saved version before saving again.',
  PROJECT_ARCHIVED: 'Restore this project before editing it.',
  INVALID_EDITOR_CONTENT: 'The section data could not be saved. Reload the project and try again.',
  PAYLOAD_TOO_LARGE: 'This portfolio is too large to save. Remove some content and try again.',
};
export function isBackendUrl(path: string): boolean {
  if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#')) return false;
  const url = new URL(path, 'https://gitfolio.invalid');
  return url.origin === 'https://gitfolio.invalid' && url.pathname.startsWith('/api/');
}

export async function apiFetch<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, init: RequestInit = {}): Promise<T> {
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
