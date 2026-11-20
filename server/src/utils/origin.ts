import type { Environment } from '../config/env.schema.js';

/**
 * Checks whether an incoming request Origin is permitted by CLIENT_URL or ALLOWED_ORIGINS.
 * Supports exact matches, comma-separated lists, and wildcard patterns (e.g. https://*.vercel.app).
 */
export function isAllowedOrigin(origin: string | undefined, environment: Environment): boolean {
  if (!origin) return false;
  if (origin === environment.CLIENT_URL) return true;

  if (!environment.ALLOWED_ORIGINS) return false;

  const allowedList = environment.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean);

  for (const allowed of allowedList) {
    if (allowed === origin) return true;
    if (allowed === '*') return true;

    if (allowed.includes('*')) {
      const escaped: string = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const pattern: string = `^${escaped}$`;
      const regex: RegExp = new RegExp(pattern);
      if (regex.test(origin)) return true;
    }
  }

  return false;
}
