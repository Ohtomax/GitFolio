import { z } from 'zod';
import type { GitHubOAuthConfiguration } from '../config/github-oauth.js';
import { ServiceError } from '../utils/service-error.js';

const lifetime = z.number().int().positive().max(315576000);
export const GitHubTokenSchema = z.object({
  access_token: z.string().min(1).max(4096),
  token_type: z.literal('bearer'),
  scope: z.string().max(2048).optional(),
  expires_in: lifetime.optional(),
  refresh_token: z.string().min(1).max(4096).optional(),
  refresh_token_expires_in: lifetime.optional(),
}).refine((value) => !value.refresh_token_expires_in || Boolean(value.refresh_token));
export type GitHubTokens = z.infer<typeof GitHubTokenSchema>;

const GitHubProfileSchema = z.object({
  id: z.number().int().positive().safe().transform(String),
  login: z.string().regex(/^[a-zA-Z0-9-]{1,39}$/),
  name: z.string().max(256).nullable(),
  email: z.string().email().max(320).nullable(),
  avatar_url: z.string().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'avatars.githubusercontent.com' &&
      !url.username && !url.password;
  }).nullable(),
});
export type GitHubProfile = z.infer<typeof GitHubProfileSchema>;

export interface GitHubProvider {
  exchangeCode(code: string, verifier: string): Promise<GitHubTokens>;
  refreshToken(token: string): Promise<GitHubTokens>;
  getProfile(token: string): Promise<GitHubProfile>;
}

export function createGitHubProvider(configuration: GitHubOAuthConfiguration, fetcher = fetch): GitHubProvider {
  async function request(url: string, init: RequestInit): Promise<unknown> {
    try {
      const response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(10000) });
      const body: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new ServiceError(401, 'GITHUB_REAUTH_REQUIRED', 'Sign in with GitHub again.');
        throw new Error();
      }
      return body;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(502, 'GITHUB_UNAVAILABLE', 'GitHub could not complete the request. Please try again.');
    }
  }

  async function tokens(parameters: Record<string, string>) {
    const body = await request(configuration.tokenUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: configuration.clientId, client_secret: configuration.clientSecret, ...parameters,
      }),
    });
    const oauthError = z.object({ error: z.string() }).safeParse(body);
    if (oauthError.success) {
      if (['bad_verification_code', 'invalid_grant', 'bad_refresh_token', 'expired_token'].includes(oauthError.data.error)) {
        throw new ServiceError(401, 'GITHUB_REAUTH_REQUIRED', 'Sign in with GitHub again.');
      }
      throw new ServiceError(502, 'GITHUB_AUTH_FAILED', 'GitHub could not complete sign-in.');
    }
    const parsed = GitHubTokenSchema.safeParse(body);
    if (!parsed.success) throw new ServiceError(502, 'GITHUB_INVALID_RESPONSE', 'GitHub returned an invalid response.');
    return parsed.data;
  }

  return {
    exchangeCode: (code, verifier) => tokens({ code, code_verifier: verifier, redirect_uri: configuration.callbackUrl }),
    refreshToken: (refresh_token) => tokens({ grant_type: 'refresh_token', refresh_token }),
    async getProfile(token) {
      const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'GitFolio' };
      const parsed = GitHubProfileSchema.safeParse(await request('https://api.github.com/user', { headers }));
      if (!parsed.success) throw new ServiceError(502, 'GITHUB_INVALID_RESPONSE', 'GitHub returned an invalid response.');
      if (!parsed.data.email) {
        const emails = z.array(z.object({
          email: z.string().email().max(320), primary: z.boolean(), verified: z.boolean(),
        })).safeParse(await request('https://api.github.com/user/emails', { headers }));
        if (!emails.success) throw new ServiceError(502, 'GITHUB_INVALID_RESPONSE', 'GitHub returned an invalid response.');
        parsed.data.email = emails.data.find((email) => email.primary && email.verified)?.email ?? null;
      }
      return parsed.data;
    },
  };
}
