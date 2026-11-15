import { rateLimit } from 'express-rate-limit';
import type { Environment } from '../config/env.schema.js';

export function apiLimiter(environment: Environment) {
  return rateLimit({
    windowMs: environment.API_RATE_LIMIT_WINDOW_MS,
    limit: environment.API_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    },
  });
}
