# Beta release candidate

The local beta candidate includes authentication, ten portfolio templates, project management, editing, and the publishing pipeline, with Phase 6 error recovery, notifications, responsive checks, and performance work. The [user guide](USER_GUIDE.md) and [operator runbook](OPERATIONS_RECOVERY.md) accompany it.

**Public beta status: not launched.** Production deployment configuration was explicitly deferred. No public frontend/API URL, real OAuth consent round trip, or real GitHub Pages publish is verified by the checks below. The current separate worker also needs a supported hosting arrangement before the requested all-free Render/Vercel/Supabase deployment can provide publishing. Local acceptance is complete only when its report passes; it does not publish anything.

## Repeat local acceptance

Install dependencies and a Playwright browser, and generate a matching Prisma client before running:

```powershell
npm run beta:check
```

The command builds all three workspaces, checks types, runs the server/client tests, checks bundle budgets, and runs browser workflows against an owned production preview on an automatically allocated loopback port. The preview stops afterward. It compares the generated Prisma schema without regenerating a DLL held by a running API. If the schema differs, stop your owned API/worker through their terminals and run `npm run db:generate` first.

The report is `.local/beta/latest.json`. It contains the starting Git commit, whether the working tree was dirty, timestamps, check results, test counts, and presence of disposable-service settings. It excludes credentials and connection URLs. A failed step exits nonzero. `passed-with-skips` identifies incomplete service coverage rather than a complete acceptance pass.

For service coverage, provide these environment variables only for explicitly disposable, migrated databases and Redis:

| Variable | Required isolation |
| --- | --- |
| `GITFOLIO_TEST_DATABASE_URL` | Database named `gitfolio_phase1_test_*` for storage/lifecycle tests |
| `GITFOLIO_TEST_RUNTIME_DATABASE_URL` | Separate database named `gitfolio_phase1_test_runtime_*`; worker reconciliation scans it |
| `GITFOLIO_TEST_TEMPLATE_DATABASE_URL` | Separate database named `gitfolio_phase1_test_templates_*`, with no existing users/templates |
| `GITFOLIO_TEST_REDIS_URL` | Disposable Redis; test queues use unique prefixes |

Never supply production or normal development data stores. Without these variables the service suites are skipped. For an installed browser, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome`; otherwise install Chromium with `npx playwright install chromium`. Browser fixtures simulate API/OAuth/GitHub responses and never publish a real repository. See [test setup](../README.md#commands).

## Local verification record

The acceptance record is dated November 18, 2026 (Asia/Manila), using Node 24.12.0, Microsoft Edge, isolated PostgreSQL 16, and isolated Redis 7. All 170 automated tests passed with no skipped tests. The report records the starting commit and working-tree state; the checked beta changes are committed with this document.

| Check | Result |
| --- | --- |
| Shared/server/client builds and workspace types | Passed |
| Server unit, HTTP, storage, queue, and worker-runtime tests | 75 passed; 0 skipped |
| Client state/service tests | 28 passed; 0 skipped |
| Production browser workflows, all ten template previews/static exports, reflow, recovery, and notifications | 67 passed; 0 skipped |
| Lazy routes, entry/sign-in bundle budgets, and brand asset budget | Passed |
| Five role React exports, built independently with TypeScript/Vite and exercised under repository paths | Passed |
| Synthetic backup/restore and encrypted-field verification | Passed |
| Configured server secrets absent from the client JavaScript | Passed |
| Local OAuth configuration | Valid; does not verify registration, credential validity, or consent |
| Hosted sign-in, real GitHub Pages publishing, and public beta | Pending; no live deployment performed |

Acceptance corrected browser selectors that needed to distinguish inline save errors from notifications and include the full-stack buttons' route labels. It also fixed a real accessibility issue: changing reduced-motion preferences while a frontend portfolio is open now immediately updates its component animation and decorative canvas. The same fix is included in static and portable React output.

The recovery drill used a separate PostgreSQL 16 container and synthetic data. A custom-format `public` schema backup restored into a newly created database with ten templates, one user, one project, seven ordered sections, one deployment snapshot, and all four applied migrations. Every restored application row matched the source. The original fixture key decrypted the stored name, email, and token; a different key failed authentication. No real account, credential, database, or repository was used. This validates the demonstrated procedure, not the operator's real backup or key custody.

## Public launch checklist

Keep these checks open until actual evidence is recorded. A source commit, browser fixture, local preview, or configuration checker alone does not complete them.

- [ ] Choose and implement the deferred hosting arrangement, including the worker and Redis.
- [ ] Record the stable frontend/API URLs and exact OAuth callback; confirm same-origin API cookies and frontend deep-link routing.
- [ ] Apply the reviewed migrations to the intended database, preserve the encryption key, and confirm service readiness and worker operation.
- [ ] Perform a real GitHub sign-in, refresh a protected page, and sign out through the hosted frontend.
- [ ] Create a portfolio, replace illustrative content, edit/save/reload it, and check desktop and mobile previews.
- [ ] Explicitly authorize a new public test target, publish one Static and one React project, and open their actual Pages URLs after Live is confirmed.
- [ ] Edit/save/republish and confirm the new commit and visible site change without altering unrelated repository content.
- [ ] Perform an isolated restore drill with an actual protected backup and original keys; record recovery time and the backup's age.
- [ ] Assign an operator, support contact, feedback route, and maintenance/recovery coverage; share the user guide with the first testers.
- [ ] Record the release commit, URLs, live verification evidence, known limitations, and invitation date before announcing availability.

Start with a small invited cohort and collect completion/failure feedback on sign-in, saving, and publishing. GitFolio currently has no technical invite allowlist, billing, guaranteed free-tier uptime, persistent offline drafts, or self-service account-deletion flow. Sharing a URL privately is not access control. Do not promise these features as part of the beta.

Feedback should contain the route/action, approximate time, browser/viewport, redacted request or deployment ID, and expected versus observed behavior. Never request a token, cookie, callback query string, or environment file. Follow the recovery runbook for incidents. Pause new invitations/publishing if saves or ownership checks fail, secrets are exposed, or unexpected public repository writes occur; keep worker recovery controlled while investigating.
