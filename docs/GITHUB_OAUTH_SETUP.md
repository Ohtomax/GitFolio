# GitHub OAuth App configuration

Local configuration is prepared. The GitHub account owner must register the OAuth App and supply its credentials before this checklist item is complete. The remaining Phase 2 tasks implement the auth endpoints, token storage, and login UI.

## Register the development app

Open [Register a new OAuth application](https://github.com/settings/applications/new) while signed in to the account that will own GitFolio. Use these values:

| GitHub field | Value |
| --- | --- |
| Application name | `GitFolio Development` |
| Homepage URL | `http://localhost:5173` |
| Application description | `Design portfolios and publish them to GitHub Pages.` |
| Authorization callback URL | `http://localhost:5173/auth/callback` |
| Enable Device Flow | Leave disabled; GitFolio uses the web application flow |

Keep the default expiring-token setting if GitHub displays it. The remaining authentication implementation must support token expiration and refresh before sign-in is shipped. Register the application, copy its Client ID, and generate a client secret. GitHub may ask you to reauthenticate for secret generation.

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

The callback must use the same origin as `CLIENT_URL`, including the hostname and port, followed by exactly `/auth/callback`. The local Vite server is pinned to port 5173 and fails if that port is occupied, so it cannot silently switch to an unregistered callback port. Stop an existing instance before starting another one.

For a deployed environment, use HTTPS and register its exact frontend callback URL with GitHub. Use separate development and production registrations to keep credentials and callback settings independent.

## Check the configuration

From the repository root, run:

```powershell
npm run oauth:check
```

This builds the configuration code, validates settings, and reports only the homepage, callback URL, and sign-in scopes. It does not require running PostgreSQL or Redis, and it never prints either credential. Missing credentials produce a nonzero exit code. A successful check validates local settings; it does not prove that the credentials were issued by GitHub or that sign-in works.

The configured sign-in scopes are `read:user` and `user:email`. Repository and workflow permissions will be requested when implementing deployment functionality rather than being added to basic sign-in now. Reference: [OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

GitHub redirects the browser to the frontend callback. The forthcoming callback component sends the code to the backend's `POST /api/auth/github/callback` endpoint for exchange. The auth module must validate the OAuth `state` and use PKCE; those protections belong to the next implementation step. Reference: [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

Only the health endpoints currently exist. Registering the app and setting its credentials does not create the callback handler or login page.
