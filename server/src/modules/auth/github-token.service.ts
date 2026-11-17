import type { GitHubProvider, GitHubTokens } from '../../providers/github.js';
import type { EncryptionService } from '../../utils/encryption.js';
import { ServiceError } from '../../utils/service-error.js';
import type { AuthRepository, CredentialUpdate } from './auth.repository.js';

export function encryptGitHubTokens(
  githubId: string, tokens: GitHubTokens, encryption: EncryptionService, now = Date.now(),
): CredentialUpdate {
  return {
    encryptedAccessToken: encryption.encrypt(tokens.access_token, `github:${githubId}:access`),
    encryptedRefreshToken: tokens.refresh_token ? encryption.encrypt(tokens.refresh_token, `github:${githubId}:refresh`) : null,
    accessTokenExpiresAt: tokens.expires_in ? new Date(now + tokens.expires_in * 1000) : null,
    refreshTokenExpiresAt: tokens.refresh_token_expires_in ? new Date(now + tokens.refresh_token_expires_in * 1000) : null,
    githubScopes: tokens.scope ?? '',
  };
}

/** Server-only entry point for later GitHub API jobs; provider tokens never reach the client. */
export function createGitHubTokenService(
  repository: AuthRepository, provider: GitHubProvider, encryption: EncryptionService, now = Date.now,
) {
  return {
    getAccessToken(userId: string): Promise<string> {
      return repository.withLockedCredentials(userId, async (stored, save) => {
        if (!stored) throw new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');
        if (!stored.accessTokenExpiresAt || stored.accessTokenExpiresAt.getTime() > now() + 60000) {
          return encryption.decrypt(stored.encryptedAccessToken, `github:${stored.githubId}:access`);
        }
        if (!stored.encryptedRefreshToken ||
          (stored.refreshTokenExpiresAt && stored.refreshTokenExpiresAt.getTime() <= now())) {
          throw new ServiceError(401, 'GITHUB_REAUTH_REQUIRED', 'Sign in with GitHub again.');
        }
        const refreshToken = encryption.decrypt(stored.encryptedRefreshToken, `github:${stored.githubId}:refresh`);
        const tokens = await provider.refreshToken(refreshToken);
        if (!tokens.refresh_token || !tokens.expires_in) {
          throw new ServiceError(502, 'GITHUB_INVALID_RESPONSE', 'GitHub returned an invalid token rotation.');
        }
        await save(encryptGitHubTokens(stored.githubId, { ...tokens, scope: tokens.scope ?? stored.githubScopes }, encryption, now()));
        return tokens.access_token;
      });
    },
  };
}
