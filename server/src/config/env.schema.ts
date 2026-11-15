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
  GITHUB_APP_ID: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GITHUB_PRIVATE_KEY_PATH: optionalString,
  GITHUB_CALLBACK_URL: optionalSecret(serviceUrl(['http:', 'https:'])),
  JWT_SECRET: optionalSecret(z.string().min(32)),
  JWT_EXPIRES_IN: z.string().regex(/^\d+(ms|s|m|h|d|w|y)$/).default('7d'),
  ENCRYPTION_KEY: optionalSecret(z.string().refine((value) => Buffer.byteLength(value, 'utf8') === 32, {
    message: 'Expected exactly 32 UTF-8 bytes',
  })),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
