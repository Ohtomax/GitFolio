# GitFolio

A full-stack portfolio builder using React, TypeScript, Express, PostgreSQL, and Prisma. The planned product lets users design portfolios and deploy them to GitHub Pages through GitHub OAuth and Octokit.

Phases 1–5 implement the foundation, GitHub authentication, projects/templates, the portfolio editor, and the deployment engine with static/React generation, GitHub publishing, status polling, history, and safe logs. [ARCHITECTURE.md](ARCHITECTURE.md) tracks the remaining polish/launch work. Real GitHub sign-in and Pages publishing still need verification with registered credentials and publishing consent.

Read [System Overview](SYSTEM_OVERVIEW.md) for GitFolio's objective, planned user workflow, benefit analysis, limitations, and success measures. [Architecture](ARCHITECTURE.md#implementation-status) separates implemented code from the remaining plan.

For the full sign-in → create → edit → publish workflow, read the [user guide](docs/USER_GUIDE.md). Operators should use the [operations and recovery runbook](docs/OPERATIONS_RECOVERY.md), including backup/restore drills, incident recovery, and the outstanding free-tier hosting decisions. Production deployment configuration is intentionally deferred.

The [beta release record](docs/BETA_RELEASE.md) separates local acceptance from the pending public launch. Run `npm run beta:check` to repeat builds, types, tests, production-browser workflows, and bundle budgets; optional service suites require disposable databases/Redis.

## Local setup

Use Node.js 22.18 or later, npm, and a running Docker Desktop. Run these PowerShell commands from the repository root:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run auth:setup
docker compose up -d --wait
npm run db:deploy
npm run dev
```

Copy the environment file only during initial setup; preserve an existing `.env`. The server and Prisma commands both load this root file, including when launched through an npm workspace. Existing process environment variables take precedence.

If PostgreSQL already occupies port 5432, set `POSTGRES_PORT=5433` and update `DATABASE_URL` to use port 5433 in `.env` before starting Compose. Likewise, change both `REDIS_PORT` and the port in `REDIS_URL` if port 6379 is occupied. Compose publishes both services only on the local loopback interface.

`npm run auth:setup` generates missing JWT and encryption secrets in the ignored root `.env` without printing them or replacing existing values. JWT secrets require at least 32 characters. Encryption keys use 64 hex characters encoding 32 random bytes; existing 32-byte UTF-8 keys are also supported. Health routes work without auth secrets, while auth endpoints return `503 AUTH_NOT_CONFIGURED` until all required secrets and credentials are present.

Register the development app using [GitHub OAuth App configuration](docs/GITHUB_OAUTH_SETUP.md), then run `npm run oauth:check` to validate the local configuration without connecting to the database or Redis. Open `http://localhost:5173/login` and use **Continue with GitHub** to reach `/dashboard`; `/account` remains available from workspace navigation. [Authentication](docs/AUTHENTICATION.md) documents routes, cookies, encryption, refresh, and recovery behavior.

The API seeds sixteen portfolio templates automatically at startup: the original Modern Minimalist, Terminal, Editorial, Bento, and Executive styles; five role-specific React portfolios; Cyber HUD, Neon Editorial, Glassmorphic Bento, Dark Executive, and Terminal Noir; and **Monochrome / Online CV**, inspired by the owner's OnlineCv portfolio. Full tokens, default content, and research notes are in [Portfolio templates](docs/PORTFOLIO_TEMPLATES.md) and [Role templates](docs/ROLE_PORTFOLIO_TEMPLATES.md). Select **New project**, choose a template, enter the project details, and create a draft. Monochrome adds an optional portrait image URL and description in the hero's Section details; leaving the image empty shows editable initials. The dashboard supports search, status filters, pagination, metadata editing, archive/restore, and confirmed deletion. Custom catalog edits and existing project drafts are preserved; untouched legacy catalog rows receive the new presets. Run `npm run db:seed` to initialize the catalog without starting the API. See [Project management](docs/PROJECT_MANAGEMENT.md) for API contracts and verification boundaries. These template JSON fields require no database migration.

Select a project's **Edit** link to add/edit/reorder/hide sections, customize colors/fonts/spacing, and preview at desktop/tablet/mobile widths. Edits save after an 800 ms pause; manual save and retry remain available. Undo/redo affects the local draft, and stale saves require a confirmed reload. **Phase 4 adds `20261118000000_editor_revision`: existing installations must run `npm run db:deploy` after PostgreSQL is running.** See [Portfolio editor](docs/PORTFOLIO_EDITOR.md) for persistence, navigation protection, and recovery limits.

Select **Publish** on a dashboard card, or **Publish & history** after saving in the editor. Authorize publishing access if requested, review the public repository and saved version, then confirm **Publish portfolio**. The worker generates a static site or a locked React project with a Pages workflow, commits to the managed `gitfolio` branch, and waits for GitHub to confirm the build before showing **Open portfolio**. History retains safe logs and source/build links. **Phase 5 adds `20261118010000_deployment_engine`; run `npm run db:deploy` before using the deployment API/worker.** See [Deployment engine](docs/DEPLOYMENT_ENGINE.md) for permissions, retry/recovery, and verification limits.

The Vite development server proxies `/api` to the configured backend so cookies remain on the frontend origin. Keep the exact `localhost` hostname during local sign-in. A production host must similarly route `/api` to the Express server and serve the SPA for frontend routes; Vite's development proxy is not included in a production build.

| Service | Address |
| --- | --- |
| Client | `http://localhost:5173` |
| API | `http://127.0.0.1:3001/api` |
| Liveness | `GET /api/health` |
| Readiness | `GET /api/health/ready` |

The API connects to PostgreSQL and Redis before listening. Liveness checks the HTTP process; readiness queries PostgreSQL and pings Redis, returning HTTP 503 when either is unavailable. Responses use the shared `{ success, data }` / `{ success, error }` contract. API requests are rate limited; configure the limit and window through `.env`.

`npm run dev` builds shared/server code and ensures a matching Prisma Client before starting shared, API, client, and deployment-worker watchers. A matching client is reused; generation runs when needed. Server changes compile once; the API restarts and the worker watches emitted files. Production runs `npm run start:worker` alongside the built API. SIGINT/SIGTERM close owned connections; worker leases recover interrupted attempts. Readiness checks PostgreSQL/Redis availability and does not prove that a publishing worker is running.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Build shared types, generate Prisma Client, and build server and client |
| `npm run typecheck` | Check all workspaces |
| `npm run beta:check` | Run local beta acceptance and write an ignored report; does not deploy |
| `npm run check:bundle` | Check a built client's lazy routes and download-size budgets |
| `npm test` | Build and run server/client foundation, auth, project/editor, and deployment tests |
| `npm run start:worker` | Run the built deployment worker alongside the API |
| `npm run auth:setup` | Generate missing local JWT/encryption secrets without printing them |
| `npm run test:browser --workspace=@gitfolio/client` | Run browser auth, project, editor, and publishing workflows against a running client |
| `npm run oauth:check` | Validate local GitHub OAuth settings without printing credentials |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:ensure` | Generate Prisma Client when out of date or required runtime files are missing |
| `npm run db:generate` | Explicitly regenerate Prisma Client; stop the local API/worker first on Windows |
| `npm run db:deploy` | Apply the committed migrations without resetting data |
| `npm run db:seed` | Add missing presets and upgrade untouched legacy defaults while preserving custom edits and drafts |
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

The database tests reject other database names, use synthetic fixtures, and remove their fixtures afterward. Set `GITFOLIO_TEST_REDIS_URL` to a disposable Redis instance too to test server startup/shutdown and real BullMQ consumption, delayed checks, and deduplication. The queue test writes only under a random `gitfolio_test_` prefix and removes that queue afterward; never point it at production services.

The full worker-runtime test also needs `GITFOLIO_TEST_RUNTIME_DATABASE_URL`, a separate migrated database named `gitfolio_phase1_test_runtime_*`. It verifies API/outbox recovery, real BullMQ processing, worker restart, and final status with simulated GitHub operations. Keep it distinct from the general test database because worker recovery scans all pending attempts in its database. Startup, build, typecheck, and test scripts use `db:ensure` to reuse a matching generated client. On Windows, stop running API/worker processes before explicit `db:generate`, or when a schema/package change requires regeneration, because a running process can hold Prisma's native DLL open. Keep Docker running and preserve the working environment file. Do not start a second `npm run dev` while the first is still running; stop it with Ctrl+C first.

Browser tests use synthetic API responses and cover OAuth, projects, editor controls/autosave, publishing confirmation, permission redirects, lost-response retries, terminal polling, paginated history/logs, guards, and narrow screens. They do not contact GitHub. After installing dependencies, run `npx playwright install chromium`, start `npm run dev:client` in another terminal, and run the browser command above. Alternatively, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` to use an installed browser. `GITFOLIO_BROWSER_BASE_URL` overrides the default `http://127.0.0.1:5173`. The optional project/editor/deployment-storage suites exercise real Prisma repositories, atomic snapshots, ownership, concurrency, outbox recovery, and worker fencing in an explicitly named disposable database. Passing these checks does not establish a real OAuth consent round trip or live Pages deployment.

Keep credentials and generated assets out of source changes; this repository already contains tracked `node_modules` files, so `.gitignore` only prevents newly generated files from being added.
