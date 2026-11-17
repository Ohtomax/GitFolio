# GitHub OAuth App configuration

The Phase 2 auth endpoints, encrypted token storage, refresh handling, login UI, and route guard are implemented. The GitHub account owner must register the OAuth App and supply its credentials before registration and live sign-in can be verified. Registration is intentionally pending in the checklist.

Phase 5 adds a separate publishing authorization step using the same OAuth App and callback. Normal sign-in keeps profile/email scopes. Publishing requests `repo` (required by GitHub's Pages REST API), plus `workflow` for React projects. These grants are requested explicitly from the deployment screen and bound to the signed-in GitHub account. See [Deployment engine](DEPLOYMENT_ENGINE.md).

## Register the development app

Open [Register a new OAuth application](https://github.com/settings/applications/new) while signed in to the account that will own GitFolio. Use these values:

| GitHub field | Value |
| --- | --- |
| Application name | `GitFolio Development` |
| Homepage URL | `http://localhost:5173` |
| Application description | `Design portfolios and publish them to GitHub Pages.` |
| Authorization callback URL | `http://localhost:5173/auth/callback` |
| Enable Device Flow | Leave disabled; GitFolio uses the web application flow |

Keep the default expiring-token setting if GitHub displays it. The server supports expiring tokens and refresh-token rotation, as well as non-expiring responses. Register the application, copy its Client ID, and generate a client secret. GitHub may ask you to reauthenticate for secret generation.

This project uses an OAuth App. Its configuration needs the Client ID and client secret; an installation ID, GitHub App ID, PEM private key, or a personal access token is not a substitute.

Reference: [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

## Save credentials locally

In the repository-root `.env` file, fill in the two empty credential values without adding them to Git:

```dotenv
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5173/auth/callback
```

Keep both credentials in the backend environment. Do not put the client secret in the frontend, give it a `VITE_` prefix, use it in shell arguments, or paste it into chat. The `.env.example` file must keep empty credential values.

Run `npm run auth:setup` to generate missing `JWT_SECRET` and `ENCRYPTION_KEY` values locally. It preserves existing secrets. All four secrets must be present before the server enables sign-in. Restart the API after changing its environment.

The callback must use the same origin as `CLIENT_URL`, including the hostname and port, followed by exactly `/auth/callback`. The local Vite server is pinned to port 5173 and fails if that port is occupied, so it cannot silently switch to an unregistered callback port. Stop an existing instance before starting another one.

For a deployed environment, use HTTPS and register its exact frontend callback URL with GitHub. Use separate development and production registrations to keep credentials and callback settings independent.

## Check the configuration

From the repository root, run:

```powershell
npm run oauth:check
```

This builds the configuration code, validates settings, and reports only the homepage, callback URL, and sign-in scopes. It does not require running PostgreSQL or Redis, and it never prints either credential. Missing credentials produce a nonzero exit code. A successful check validates local settings; it does not prove that the credentials were issued by GitHub or that sign-in works.

The configured sign-in scopes are `read:user` and `user:email`. Repository and workflow permissions will be requested when implementing deployment functionality rather than being added to basic sign-in now. Reference: [OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

GitHub redirects the browser to the frontend callback. The callback component sends `{ code, state }` to `POST /api/auth/github/callback` for server-side exchange. Redis state is browser-bound, expires after ten minutes, and is consumed atomically. The exchange includes the original S256 PKCE verifier. Reference: [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

After starting PostgreSQL/Redis and applying migrations with `npm run db:deploy`, run `npm run dev` and open `http://localhost:5173/login`. Complete GitHub consent to reach `/dashboard`, check the connected account through the Account navigation link, reload to verify the session, and sign out. Denied consent and expired attempts offer a fresh sign-in. See [Authentication](AUTHENTICATION.md) for storage, API, session revocation, and verification limits.
