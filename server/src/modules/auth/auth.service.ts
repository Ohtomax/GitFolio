import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AuthUser, OAuthCallback } from '@gitfolio/shared';
import type { GitHubOAuthConfiguration } from '../../config/github-oauth.js';
import type { GitHubProvider } from '../../providers/github.js';
import type { EncryptionService } from '../../utils/encryption.js';
import { ServiceError } from '../../utils/service-error.js';
import type { AuthRepository, StoredProfile } from './auth.repository.js';
import { encryptGitHubTokens } from './github-token.service.js';

export interface OAuthState { verifier: string; bindingHash: string }
export interface OAuthStateStore {
  put(state: string, value: OAuthState, seconds: number): Promise<void>;
  take(state: string): Promise<OAuthState | null>;
}
const hash = (value: string) => createHash('sha256').update(value).digest();
const invalidState = () => new ServiceError(400, 'OAUTH_STATE_INVALID', 'This sign-in attempt expired or was already used. Please start again.');

export function createAuthService(configuration: GitHubOAuthConfiguration, repository: AuthRepository,
  provider: GitHubProvider, encryption: EncryptionService, states: OAuthStateStore) {
  function publicProfile(stored: StoredProfile): AuthUser {
    return { ...stored,
      name: stored.name === null ? null : encryption.decrypt(stored.name, `github:${stored.githubId}:name`),
      email: stored.email === null ? null : encryption.decrypt(stored.email, `github:${stored.githubId}:email`),
    };
  }
  return {
    async begin() {
      const state = randomBytes(32).toString('base64url');
      const binding = randomBytes(32).toString('base64url');
      const verifier = randomBytes(32).toString('base64url');
      await states.put(state, { verifier, bindingHash: hash(binding).toString('hex') }, 600);
      const url = new URL(configuration.authorizationUrl);
      url.search = new URLSearchParams({ client_id: configuration.clientId,
        redirect_uri: configuration.callbackUrl, scope: configuration.scopes.join(' '), state,
        code_challenge: hash(verifier).toString('base64url'), code_challenge_method: 'S256' }).toString();
      return { authorizationUrl: url.href, binding };
    },
    async complete(callback: OAuthCallback, binding: string) {
      // Atomic GETDEL consumes the state before any provider request, including failed exchanges.
      const saved = await states.take(callback.state);
      if (!saved) throw invalidState();
      const expected = Buffer.from(saved.bindingHash, 'hex');
      const actual = hash(binding);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw invalidState();
      const tokens = await provider.exchangeCode(callback.code, saved.verifier);
      // Revalidate GitHub identity for every code exchange; never trust callback profile fields.
      const profile = await provider.getProfile(tokens.access_token);
      const stored = await repository.upsertProfile({ githubId: profile.id, login: profile.login,
        name: profile.name ? encryption.encrypt(profile.name, `github:${profile.id}:name`) : null,
        email: profile.email ? encryption.encrypt(profile.email, `github:${profile.id}:email`) : null,
        avatarUrl: profile.avatar_url, ...encryptGitHubTokens(profile.id, tokens, encryption) });
      return publicProfile(stored);
    },
    async getUser(userId: string) {
      const stored = await repository.findProfile(userId);
      if (!stored) throw new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');
      return publicProfile(stored);
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
