import pino, { type Logger } from 'pino';

export function createLogger(level = 'info'): Logger {
  return pino({
    level,
    base: { service: 'gitfolio-api' },
    redact: {
      paths: [
        'authorization', 'cookie', 'password', 'token', 'secret',
        'accessToken', 'refreshToken', 'encryptedAccessToken',
        '*.password', '*.token', '*.secret', '*.accessToken', '*.refreshToken',
        '*.encryptedAccessToken', 'req.headers.authorization', 'req.headers.cookie',
        'req.body', 'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
  });
}
