import { OAuthCallbackSchema, type OAuthCallback } from '@gitfolio/shared';

export const RETURN_TO_KEY = 'gitfolio_return_to';
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') ||
    value.startsWith('//') || /[\\\r\n]/.test(value)) return '/account';
  const url = new URL(value, 'https://gitfolio.invalid');
  if (url.origin !== 'https://gitfolio.invalid' || !/^\/(account|dashboard|projects)(\/|$)/.test(url.pathname)) return '/account';
  return `${url.pathname}${url.search}`;
}

export type CallbackResult = { input: OAuthCallback; error: null } | { input: null; error: string };
export function parseOAuthCallback(search: string): CallbackResult {
  const params = new URLSearchParams(search);
  if (params.has('error')) return { input: null, error: params.get('error') === 'access_denied'
    ? 'GitHub sign-in was cancelled. You can try again whenever you’re ready.'
    : 'GitHub could not authorize this sign-in. Please start again.' };
  const result = OAuthCallbackSchema.safeParse({ code: params.get('code'), state: params.get('state') });
  if (!result.success || params.getAll('code').length !== 1 || params.getAll('state').length !== 1) {
    return { input: null, error: 'This sign-in link is incomplete or has expired. Please start again.' };
  }
  return { input: result.data, error: null };
}
