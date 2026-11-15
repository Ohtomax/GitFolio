import type { Environment } from './env.schema.js';

export const GITHUB_OAUTH_SCOPES = ['read:user', 'user:email'] as const;

export interface GitHubOAuthConfiguration {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly callbackUrl: string;
  readonly authorizationUrl: string;
  readonly tokenUrl: string;
  readonly scopes: typeof GITHUB_OAUTH_SCOPES;
}

// Call with a validated Environment. Credentials remain in server-only code.
export function getGitHubOAuthConfiguration(environment: Environment): GitHubOAuthConfiguration | null {
  if (!environment.GITHUB_CLIENT_ID || !environment.GITHUB_CLIENT_SECRET) return null;

  return Object.freeze({
    clientId: environment.GITHUB_CLIENT_ID,
    clientSecret: environment.GITHUB_CLIENT_SECRET,
    callbackUrl: environment.GITHUB_CALLBACK_URL ?? new URL('/auth/callback', environment.CLIENT_URL).href,
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: GITHUB_OAUTH_SCOPES,
  });
}
