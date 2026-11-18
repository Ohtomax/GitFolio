# Operations and recovery

This runbook describes the implemented application. Production deployment configuration is intentionally deferred. Hosting preferences are Render for the API, Vercel for the frontend, and Supabase PostgreSQL, using free plans. No provider resources, proxy configuration, or combined API/worker mode are supplied by this documentation.

## Runtime and service ownership

| Component | Existing command / contract | Persistent state |
| --- | --- | --- |
| Frontend | `npm run build --workspace=@gitfolio/client`; serve `client/dist` with SPA fallbacks | None; unsaved editor recovery is memory-only |
| API | `npm run start --workspace=@gitfolio/server` after a build | PostgreSQL drafts, template catalog, deployment records |
| Publishing worker | `npm run start:worker` after a build; separate process | PostgreSQL snapshots, source checkpoints, and leases; BullMQ in Redis |
| PostgreSQL | Apply committed migrations with `npm run db:deploy` | Users, encrypted credentials/profile fields, templates, projects, sections, deployments |
| Redis | Configured by `REDIS_URL` | Sessions, short-lived OAuth state, and deployment queue jobs |

`npm run dev` manages the development watchers together. An installed library, a schema migration, or a healthy API does not establish a running worker or a working GitHub deployment.

## Hosting decisions still required

Vercel must serve the SPA and forward `/api` to the API under the frontend origin because the client uses same-origin HTTP-only cookies. Set the API's exact `CLIENT_URL` and frontend `/auth/callback` URL consistently when deployment configuration is implemented. Development's Vite proxy is not shipped as hosting infrastructure. Preview deployments need their own deliberate OAuth/origin arrangement; they are not automatically trusted.

Render's free web service can sleep after idle traffic and a free Key Value restart loses its data. A dedicated background worker is not a free service type. The current source still starts the worker separately, so the requested free hosting arrangement has an unresolved worker-hosting decision. This must be resolved before public beta publishing is considered available. [Render free instances](https://render.com/docs/free)

Use the session-pooler connection string supplied by Supabase for an IPv4 server connection; copy its host and username rather than deriving them. A small Prisma connection limit is needed for both API and worker pools. Keep database credentials server-side, verify TLS, and review the project's exposed Data API/schema permissions before using application tables. This repo does not install Supabase RLS policies or Supabase Auth. [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)

Free Supabase projects can pause after low activity and do not include automatic backups. Plan manual exports and recovery before inviting users. [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Free-plan backups](https://supabase.com/kb/faqs/platform/free-plan-backups)

## Release and migration procedure

Record the intended Git commit, migration list, provider origins, operator, and maintenance window in a private release record. Preserve the original `ENCRYPTION_KEY` and other application secrets outside the repository. Take a database backup before a schema change.

Run quality checks against disposable services as described in [README](../README.md#commands). Build from a consistent commit. For an installed checkout:

```powershell
npm run build
npm run typecheck
npm test
npm run check:bundle
```

On Windows, a running API/worker can lock Prisma's native DLL during client generation. Stop those processes through their own terminals before a full build; do not kill unrelated Node processes. With an unchanged schema and a matching generated client, individual workspace builds and typechecks avoid unnecessary regeneration.

Stop scheduling new publishing during maintenance, then stop the owned worker and API gracefully. Apply migrations using `npm run db:deploy`, inspect `npm run db:status`, start the API, check readiness, and start the worker. Startup seeds missing presets without replacing edited catalog rows or existing drafts. Do not use `db:push`, `migrate reset`, or a development migration command against production.

The database outbox recovers unfinished attempts when the worker starts. Check the intended public targets before allowing recovery after a database restore. A code rollback does not undo schema/data changes; prefer a compatible fix, or restore to a new database and verify it before switching the application.

## Health, logs, and observation

`GET /api/health` checks the HTTP process. `GET /api/health/ready` queries PostgreSQL and pings Redis. A readiness failure returns 503. Readiness does not prove that the worker, OAuth consent, or GitHub Pages is working.

Watch API/worker startup and shutdown logs, deployment age/status, failed attempts, service memory/connection limits, database size, and provider quotas. The worker logs a ready message only after its database and queue connections are established. It reconciles unfinished records every 15 seconds; normal active status polling is every three seconds while the tab is visible. Publishing attempts have a 30-minute deadline.

Use timestamp, Git commit, request ID, and project/deployment UUID to correlate an incident. Preserve sanitized log codes. Never enable request-body/token dumps or place callback query strings, profile data, environment files, or database passwords in tickets. A support contact/channel must be chosen before inviting external testers.

## Back up the database and keys

Keep backups private and off the application host. Use a current PostgreSQL client compatible with the source server. For a dedicated GitFolio database, export the `public` schema, including `_prisma_migrations`, enum types, constraints, and application data. Supabase's own managed schemas are outside this application backup. Store a separate encrypted copy of the original application secrets and a record of the matching application commit.

For a local Compose database, these commands preserve the dump as binary even in older PowerShell versions:

```powershell
New-Item -ItemType Directory -Force .local/backups | Out-Null
docker compose exec -T postgres pg_dump -U gitfolio -d gitfolio_dev --format=custom --no-owner --no-privileges --schema=public --file=/tmp/gitfolio-backup.dump
if ($LASTEXITCODE -ne 0) { throw 'Database export failed' }
docker compose cp postgres:/tmp/gitfolio-backup.dump .local/backups/gitfolio-backup.dump
if ($LASTEXITCODE -ne 0) { throw 'Backup copy failed' }
Get-FileHash .local/backups/gitfolio-backup.dump -Algorithm SHA256
```

Use a unique filename for each retained backup; the example filename is not a rotation policy. Copy the dump to protected off-host storage and record its checksum, date, source commit, and migration status. Do not copy `.env` into an unencrypted backup directory or commit it. A checksum proves that bytes match, not that a database can be restored.

For a hosted database, run `pg_dump` from a trusted terminal with connection parameters supplied through PostgreSQL's secure connection configuration. An interactive password prompt avoids placing a password in command history. For example, set `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, and `PGSSLMODE=verify-full` to the approved connection details, then use the same export options and an absolute `--file` path. Never disable certificate verification to bypass an unexpected TLS error. Keep credentials out of process arguments and shared logs.

## Restore drill in an isolated database

Never test a restore on the active database. The following requires a newly created disposable database. It removes that database's initial empty `public` schema before importing the archive's schema definition. This step has no `CASCADE` and fails if the schema contains objects:

```powershell
$restoreDatabase = 'gitfolio_phase1_test_restore_20261118'
if ($restoreDatabase -notmatch '^gitfolio_phase1_test_restore_[a-z0-9_]+$') { throw 'Use a disposable restore database name' }
docker compose exec -T postgres createdb -U gitfolio $restoreDatabase
if ($LASTEXITCODE -ne 0) { throw 'Choose a new empty restore database' }
docker compose exec -T postgres psql -U gitfolio --dbname=$restoreDatabase --set=ON_ERROR_STOP=1 --command='DROP SCHEMA public;'
if ($LASTEXITCODE -ne 0) { throw 'Restore target was not empty; stop and choose a new database' }
docker compose cp .local/backups/gitfolio-backup.dump postgres:/tmp/gitfolio-restore.dump
if ($LASTEXITCODE -ne 0) { throw 'Restore copy failed' }
docker compose exec -T postgres pg_restore -U gitfolio --dbname=$restoreDatabase --exit-on-error --no-owner --no-privileges /tmp/gitfolio-restore.dump
if ($LASTEXITCODE -ne 0) { throw 'Restore failed; do not switch the application' }
```

Verify migration history, row counts, owner relationships, section order, saved themes, and deployment snapshots through trusted tools. Use an isolated API/Redis pair and the original encryption key to check a known account record and draft. Keep real publishing disabled during the drill. Confirm that the restored application can read encrypted data; a successful SQL import alone is insufficient. Reapply reviewed database ownership/grants when restoring with `--no-owner --no-privileges`.

Record elapsed time and the age of the backup so recovery time and potential data loss are explicit. The beta acceptance checks use synthetic data; they do not validate the operator's real backup or encryption key. Retain the previous live database until recovery is accepted. Delete disposable resources only after verifying their exact names and ownership.

On November 18, 2026, this procedure was exercised with PostgreSQL 16 in an isolated container. Ten templates, one synthetic account, one project, seven sections, one deployment snapshot, and all four migrations matched after restore. The original fixture key decrypted the restored encrypted profile/token fields, and a different key was rejected. No real credentials, development data, or GitHub operations were involved.

## Recover an incident

| Symptom | Investigation and recovery |
| --- | --- |
| API never listens | Check required environment variable names, PostgreSQL/Redis connectivity, migration status, and port binding; do not paste secret values into logs |
| Readiness 503 | Recover the failed database/Redis dependency, then retry; liveness alone is insufficient |
| Sign-in unavailable | Check OAuth/secrets with `npm run oauth:check`; confirm exact frontend origin and callback in GitHub; repeat real consent separately |
| Reused/expired OAuth state | Start sign-in again; do not replay a callback code or recreate old OAuth state |
| All sessions end after Redis restarts | Users sign in again; sessions and OAuth state are intentionally not reconstructed from tokens |
| Queue lost after Redis restart | Restore Redis connectivity and start the worker; the PostgreSQL outbox recreates missing jobs without deleting project content |
| Attempt stuck Queued | Check the separate worker's ready log, credentials, queue/database connectivity, and whether the host is sleeping |
| Attempt interrupted mid-publish | Keep its database record; allow reconciliation and up to the 90-second lease expiry; the provider reuses acknowledged source/commit metadata |
| GitHub permission/account error | Reauthorize with the owning account; never substitute another user's token |
| Repository/write conflict | Inspect the `gitfolio` branch and `.gitfolio.json` ownership marker; use a new target or restore the correct branch, without force-pushing unrelated history |
| Build failed / timed out | Inspect the linked GitHub build and saved version, correct the issue, and start a new attempt after reviewing history |
| Editor conflict | Preserve needed local text and reload the saved version; do not force an older revision into the database |
| Encryption key missing or wrong | Recover the original key from protected storage; a new key cannot decrypt old records; stop rather than rewriting encrypted fields |
| Database restored from an older backup | Keep the worker stopped; review unfinished attempts and newer GitHub commits before recovery is allowed to write publicly |

Do not flush Redis globally, delete queue/outbox records to hide failures, clear database leases manually, or mark an attempt Live without GitHub verification. Confirmed external writes can finish during a crash; the recorded deployment/manifest must guide retries.

If restoring from backup, start the API first with the worker stopped and review affected projects. Archive projects whose old pending attempts should not publish; archiving does not remove existing public sites. After the intended recovery is reviewed, start the worker and observe its history. Existing repositories and Pages sites are external state and are not rolled back by restoring PostgreSQL.

## Account and data requests

Project deletion cascades to its saved sections/deployments; archiving preserves them. Neither operation deletes the external GitHub repository/site. GitFolio currently has no self-service account deletion or historical draft restore UI. Verify account ownership before handling requests through trusted operator tooling, account for retained backups, and document the action privately. Follow the [user guide](USER_GUIDE.md) when helping users revoke GitHub authorization or remove an external site.

## Resume service and verify

Confirm readiness, perform a real sign-in through the frontend origin, load a known saved project, save a harmless reviewed edit, and sign out. Verify the worker separately. With an explicitly reviewed test project and public target, publish and check the actual Pages site and matching commit before declaring publishing restored. Check narrow-screen navigation and error recovery as well as the happy path. Record which checks used real services and which were simulated; never convert a local test pass into a claim of a live public release.
