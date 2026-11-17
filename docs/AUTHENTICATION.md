# Authentication

GitFolio uses GitHub OAuth with S256 PKCE and browser-bound, one-time state. The server performs the code exchange and fetches the GitHub identity on every sign-in. GitHub access and refresh tokens stay on the server.

## Local configuration

1. Run `npm run auth:setup` to generate missing JWT and encryption secrets in the ignored root `.env`. Existing secrets and GitHub credentials are preserved. Generated encryption keys contain 32 random bytes encoded as 64 hex characters.
2. Follow [GitHub OAuth setup](GITHUB_OAUTH_SETUP.md) to register the development app and save its credentials locally.
3. Start PostgreSQL and Redis with `docker compose up -d --wait`, then apply migrations with `npm run db:deploy`.
4. Run `npm run oauth:check` and `npm run dev`. Open `http://localhost:5173` consistently; do not switch between `localhost` and `127.0.0.1` during sign-in.

Without all four secrets, auth endpoints return `503 AUTH_NOT_CONFIGURED`; health endpoints remain available. `oauth:check` validates local configuration and does not prove GitHub registration or a successful sign-in.

## API contract

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/auth/github` | Stores state/PKCE in Redis for ten minutes, sets a browser binding cookie, and redirects to GitHub |
| POST | `/api/auth/github/callback` | Accepts strictly validated `{ code, state }`, consumes state atomically, exchanges code, persists encrypted credentials, sets a session cookie, and returns `{ user, expiresAt }` |
| GET | `/api/auth/me` | Verifies the JWT and Redis session, then returns the current user and session expiration |
| POST | `/api/auth/logout` | Revokes the current Redis session and clears the session cookie |

Responses use the shared API envelope. Auth responses are never cached. Callback and cookie-authenticated mutations require the configured frontend `Origin`. The API group and sign-in routes have rate limits. The public OAuth endpoints intentionally do not require an existing JWT; `/me` and `/logout` use `verifyToken`.

JWTs use HS256 with fixed issuer/audience and contain only user/session identifiers and timestamps. The browser receives an HttpOnly, SameSite=Lax cookie scoped to `/api`; it becomes Secure with HTTPS or production configuration. Protected server routes must use `verifyToken` and ownership-scoped repository queries. Bearer JWTs are supported for server API clients. Logging omits URLs, headers, bodies, provider responses, tokens, codes, and personal information.

## Credential storage and refresh

AES-256-GCM uses a new 12-byte nonce per encryption, a 16-byte authentication tag, and associated data binding each field to its GitHub account and purpose. Access/refresh tokens and private profile names/emails are encrypted before writing to PostgreSQL. Public GitHub IDs and handles provide account lookup without searching private profile fields. Missing expiration fields represent a non-expiring token; expiry dates and refresh tokens are saved when supplied by GitHub.

Server-side GitHub integrations must call `createGitHubTokenService(...).getAccessToken(userId)` before provider operations. The service refreshes within 60 seconds of expiry and atomically replaces the access token, refresh token, and lifetimes. A PostgreSQL row lock serializes refreshes across processes. Expired or rejected refresh tokens return `GITHUB_REAUTH_REQUIRED`; the client must sign in again. A provider failure never replaces stored credentials. If a provider rotates tokens but the subsequent database commit fails, sign-in may be required to recover.

Keep `ENCRYPTION_KEY` stable across restarts and preserve it in recovery backups. Changing it without re-encrypting existing data makes saved credentials and private profile fields unreadable. Changing `JWT_SECRET` invalidates sessions. Redis expiration/restarts invalidate OAuth attempts and sessions; users sign in again. No GitHub token is written to frontend storage or returned through auth APIs.

## Verification limits

The client keeps user/status data in a non-persistent Zustand store and reconstructs the session through TanStack Query's `/me` request after reload. `AuthGuard` withholds protected content during verification, redirects anonymous/expired sessions, and offers retry during an outage. Successful sign-in and logout clear cached data from previous sessions. OAuth callback requests are deduplicated for React StrictMode, and code/state query parameters are removed from browser history. Post-login destinations are restricted to internal protected routes. Only the nonsensitive return destination uses sessionStorage.

The automated auth tests use synthetic GitHub responses and check encryption, PKCE, browser binding, replay rejection, JWT verification/revocation, and refresh rotation. Actual GitHub sign-in still requires registered credentials and a browser consent round trip. Database/Redis integration tests run only when their explicitly named disposable service URLs are provided.
