import type { CookieOptions, Request } from 'express';
import type { Environment } from '../config/env.schema.js';

export const SESSION_COOKIE = 'gitfolio_session';
export const OAUTH_COOKIE = 'gitfolio_oauth';

export function cookieOptions(environment: Environment): CookieOptions {
  return { httpOnly: true, secure: environment.NODE_ENV === 'production' ||
    new URL(environment.CLIENT_URL).protocol === 'https:', sameSite: 'lax', path: '/api' };
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header || header.length > 8192) return undefined;
  const matches = header.split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`));
  // Duplicate cookies can arise from cookie tossing; fail closed.
  if (matches.length !== 1) return undefined;
  try { return decodeURIComponent(matches[0].slice(name.length + 1)); } catch { return undefined; }
}
