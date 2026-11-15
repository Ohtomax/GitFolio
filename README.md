# GitFolio

A full-stack portfolio builder using React, TypeScript, Express, PostgreSQL, and Prisma. The planned product lets users design portfolios and deploy them to GitHub Pages through GitHub OAuth and Octokit.

Phase 1 supplies the monorepo foundation, database schema and migration, validated configuration, and API bootstrap. Authentication, project APIs, the editor, and deployments are later phases in [ARCHITECTURE.md](ARCHITECTURE.md).

## Local setup

Use Node.js 22 or later, npm, and a running Docker Desktop. Run these PowerShell commands from the repository root:

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d --wait
npm run db:deploy
npm run dev
```

Copy the environment file only during initial setup; preserve an existing `.env`. The server and Prisma commands both load this root file, including when launched through an npm workspace. Existing process environment variables take precedence.

If PostgreSQL already occupies port 5432, set `POSTGRES_PORT=5433` and update `DATABASE_URL` to use port 5433 in `.env` before starting Compose. Likewise, change both `REDIS_PORT` and the port in `REDIS_URL` if port 6379 is occupied. Compose publishes both services only on the local loopback interface.

GitHub credentials, `JWT_SECRET`, and `ENCRYPTION_KEY` may remain empty during Phase 1. Supplied secrets are validated: JWT secrets require at least 32 characters, and encryption keys require exactly 32 UTF-8 bytes. No authentication or protected resource routes are exposed yet.

The first Phase 2 setup step is documented in [GitHub OAuth App configuration](docs/GITHUB_OAUTH_SETUP.md). Local settings are prepared; app registration and credentials still require the GitHub account owner. Run `npm run oauth:check` after saving the credentials to validate the configuration without connecting to the database or Redis.

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
| `npm test` | Build and run the API/configuration tests |
| `npm run oauth:check` | Validate local GitHub OAuth settings without printing credentials |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:deploy` | Apply the committed migrations without resetting data |
| `npm run db:migrate -- --name describe_change` | Create/apply a migration in a development database |
| `npm run db:status` | Inspect migration status |
| `npm run db:studio` | Open Prisma Studio locally |

The schema contains users, templates, projects, ordered sections, and deployments. Project slugs are unique per owner. A composite foreign key prevents a deployment from referring to another user's project; deleting a user or project cascades to its dependent records. Templates referenced by projects cannot be deleted. The token column is reserved for ciphertext; token encryption is part of Phase 2.

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

Keep credentials and generated assets out of source changes; this repository already contains tracked `node_modules` files, so `.gitignore` only prevents newly generated files from being added.
