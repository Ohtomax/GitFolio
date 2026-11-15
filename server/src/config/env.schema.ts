import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().trim().min(1).optional(),
);

function serviceUrl(protocols: string[]) {
  return z.string().url().refine((value) => {
    try {
      return protocols.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, {
    message: `Expected protocol: ${protocols.join(' or ')}`,
  });
}

const optionalSecret = <Schema extends z.ZodType<string>>(schema: Schema) => z.preprocess(
  (value) => value === '' ? undefined : value,
  schema.optional(),
);

export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_HOST: z.string().trim().min(1).default('127.0.0.1'),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CLIENT_URL: serviceUrl(['http:', 'https:']).refine((value) => {
    try {
      const url = new URL(value);
      return url.username === '' && url.password === '' && url.pathname === '/' &&
        url.search === '' && url.hash === '';
    } catch {
      return false;
    }
  }, { message: 'Expected an HTTP origin without a path, credentials, query, or fragment' })
    .transform((value) => new URL(value).origin),
  DATABASE_URL: serviceUrl(['postgres:', 'postgresql:']),
  REDIS_URL: serviceUrl(['redis:', 'rediss:']),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().max(2147483647).default(60000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1000000).default(100),
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GITHUB_CALLBACK_URL: optionalSecret(serviceUrl(['http:', 'https:'])),
  JWT_SECRET: optionalSecret(z.string().min(32)),
  JWT_EXPIRES_IN: z.string().regex(/^\d+(ms|s|m|h|d|w|y)$/).default('7d'),
  ENCRYPTION_KEY: optionalSecret(z.string().refine((value) => Buffer.byteLength(value, 'utf8') === 32, {
    message: 'Expected exactly 32 UTF-8 bytes',
  })),
}).superRefine((environment, context) => {
  const hasClientId = environment.GITHUB_CLIENT_ID !== undefined;
  const hasClientSecret = environment.GITHUB_CLIENT_SECRET !== undefined;

  if (hasClientId !== hasClientSecret) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [hasClientId ? 'GITHUB_CLIENT_SECRET' : 'GITHUB_CLIENT_ID'],
      message: 'Configure both GitHub OAuth App credentials together',
    });
  }

  if (!hasClientId && !hasClientSecret && !environment.GITHUB_CALLBACK_URL) return;

  // OAuth codes return to the frontend route specified in the architecture plan.
  // The auth module will exchange them server-side in a later Phase 2 step.
  try {
    const callback = new URL(environment.GITHUB_CALLBACK_URL ?? '/auth/callback', environment.CLIENT_URL);
    const clientOrigin = new URL(environment.CLIENT_URL).origin;
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(callback.hostname);

    if (callback.origin !== clientOrigin || callback.pathname !== '/auth/callback' ||
      callback.username !== '' || callback.password !== '' || callback.search !== '' || callback.hash !== '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GITHUB_CALLBACK_URL'],
        message: 'Use the CLIENT_URL origin with the /auth/callback path and no credentials, query, or fragment',
      });
    }

    if (callback.protocol !== 'https:' && (environment.NODE_ENV === 'production' || !isLoopback)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GITHUB_CALLBACK_URL'],
        message: 'HTTPS is required except for loopback callbacks in development or test',
      });
    }
  } catch {
    // The field-level URL schemas already reject malformed URLs without exposing values.
  }
});

export type Environment = z.infer<typeof EnvironmentSchema>;
