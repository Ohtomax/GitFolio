# GitFolio

A full-stack portfolio builder using React, TypeScript, Express, PostgreSQL, and Prisma. The planned product lets users design portfolios and deploy them to GitHub Pages through GitHub OAuth and Octokit.

Phase 1 supplies the monorepo foundation. Phase 2 implements GitHub OAuth, encrypted token storage and refresh, revocable JWT sessions, and the login/account UI. GitHub app registration and real sign-in remain pending until credentials are supplied. Project APIs, the editor, and deployments are later phases in [ARCHITECTURE.md](ARCHITECTURE.md).

Read [System Overview](SYSTEM_OVERVIEW.md) for GitFolio's objective, planned user workflow, benefit analysis, limitations, and success measures. [Architecture](ARCHITECTURE.md#implementation-status) separates implemented code from the remaining plan.

## Local setup

Use Node.js 22.18 or later, npm, and a running Docker Desktop. Run these PowerShell commands from the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run auth:setup
docker compose up -d --wait
npm run db:deploy
npm run dev
```

Copy the environment file only during initial setup; preserve an existing `.env`. The server and Prisma commands both load this root file, including when launched through an npm workspace. Existing process environment variables take precedence.

If PostgreSQL already occupies port 5432, set `POSTGRES_PORT=5433` and update `DATABASE_URL` to use port 5433 in `.env` before starting Compose. Likewise, change both `REDIS_PORT` and the port in `REDIS_URL` if port 6379 is occupied. Compose publishes both services only on the local loopback interface.

`npm run auth:setup` generates missing JWT and encryption secrets in the ignored root `.env` without printing them or replacing existing values. JWT secrets require at least 32 characters. Encryption keys use 64 hex characters encoding 32 random bytes; existing 32-byte UTF-8 keys are also supported. Health routes work without auth secrets, while auth endpoints return `503 AUTH_NOT_CONFIGURED` until all required secrets and credentials are present.

Register the development app using [GitHub OAuth App configuration](docs/GITHUB_OAUTH_SETUP.md), then run `npm run oauth:check` to validate the local configuration without connecting to the database or Redis. Open `http://localhost:5173/login`, use **Continue with GitHub**, and verify the connected account at `/account`. [Authentication](docs/AUTHENTICATION.md) documents routes, cookies, encryption, refresh, and recovery behavior.

The Vite development server proxies `/api` to the configured backend so cookies remain on the frontend origin. Keep the exact `localhost` hostname during local sign-in. A production host must similarly route `/api` to the Express server and serve the SPA for frontend routes; Vite's development proxy is not included in a production build.

| Service | Address |
| --- | --- |
| Client | `http://localhost:5173` |
| API | `http://127.0.0.1:3001/api` |
| Liveness | `GET /api/health` |
| Readiness | `GET /api/health/ready` |

The API connects to PostgreSQL and Redis before listening. Liveness checks the HTTP process; readiness queries PostgreSQL and pings Redis, returning HTTP 503 when either is unavailable. Responses use the shared `{ success, data }` / `{ success, error }` contract. API requests are rate limited; configure the limit and window through `.env`.

`npm run dev` builds the shared package and generates Prisma Client before starting all three workspace watchers. Server changes rebuild TypeScript before restarting Node, avoiding an ESM TypeScript loader. SIGINT/SIGTERM drain HTTP connections and disconnect database and Redis clients.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Build shared types, generate Prisma Client, and build server and client |
| `npm run typecheck` | Check all workspaces |
| `npm test` | Build and run server and client auth tests |
| `npm run auth:setup` | Generate missing local JWT/encryption secrets without printing them |
| `npm run test:browser --workspace=@gitfolio/client` | Run optional browser auth/guard tests against a running client |
| `npm run oauth:check` | Validate local GitHub OAuth settings without printing credentials |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:deploy` | Apply the committed migrations without resetting data |
| `npm run db:migrate -- --name describe_change` | Create/apply a migration in a development database |
| `npm run db:status` | Inspect migration status |
| `npm run db:studio` | Open Prisma Studio locally |

The schema contains users, templates, projects, ordered sections, and deployments. Project slugs are unique per owner. A composite foreign key prevents a deployment from referring to another user's project; deleting a user or project cascades to its dependent records. Templates referenced by projects cannot be deleted. Phase 2 adds encrypted refresh-token and expiration storage. Access/refresh tokens and private profile names/emails are encrypted before persistence. Keep the encryption key stable across restarts and backups.

Database integration tests are optional during a normal `npm test` run. To exercise constraints and cascades, create a disposable database whose name starts with `gitfolio_phase1_test_`, migrate it, and run:

```powershell
$env:DATABASE_URL = 'postgresql://gitfolio:gitfolio@localhost:5432/gitfolio_phase1_test_local'
npm run db:deploy
$env:GITFOLIO_TEST_DATABASE_URL = $env:DATABASE_URL
npm test
Remove-Item Env:DATABASE_URL
Remove-Item Env:GITFOLIO_TEST_DATABASE_URL
```

The database tests reject other database names, use synthetic fixtures, and remove their fixtures afterward. Set `GITFOLIO_TEST_REDIS_URL` to a disposable Redis instance too to test server startup, readiness, and shutdown against both real services. Tests do not enqueue jobs or write Redis keys.

Browser tests use synthetic API responses, cover successful/denied OAuth, duplicate callbacks, reload/logout, guard loading/outages/expiry, and mobile overflow, and do not contact GitHub. After installing dependencies, run `npx playwright install chromium`, start `npm run dev:client` in another terminal, and run the browser command above. Alternatively, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` to use an installed browser. `GITFOLIO_BROWSER_BASE_URL` overrides the default `http://127.0.0.1:5173`. Passing tests do not verify real GitHub credentials or the consent round trip.

Keep credentials and generated assets out of source changes; this repository already contains tracked `node_modules` files, so `.gitignore` only prevents newly generated files from being added.
