# Deployment engine

Phase 5 is implemented as six separately committed capabilities. Generated portfolios are public static sites; GitFolio's API, database, Redis, and worker run separately from GitHub Pages.

## Queue

The `deployments` BullMQ queue carries only a deployment UUID. Producers fail quickly when Redis is unavailable; workers use a separate retrying connection. Registration validates both the job name and strict ID-only payload. Verification can delay the same job without creating another deployment. Worker concurrency is two, stalled jobs can resume, completed/failed job retention is bounded, and errors omit credentials/provider responses. Database deployment records will supply durable state and recovery; Redis is not the project-content store.

`deployment-queue.test.mjs` includes an optional real-Redis registration/delay/deduplication test. Set `GITFOLIO_TEST_REDIS_URL` to a disposable instance; the test writes only under a random `gitfolio_test_` prefix and deletes only that prefix's queue.

Connection behavior follows the [BullMQ connection guide](https://docs.bullmq.io/guide/connections). Runtime composition, generators, GitHub integration, API, and client workflows are documented below as they are completed.

## Static generator

The Mustache generator produces `index.html`, `style.css`, `script.js`, and `.nojekyll` entirely in memory from a validated project snapshot. It preserves section order, excludes hidden sections, supports all seven types and their entries/calls to action, and applies the saved colors/font/spacing. Links and asset paths work beneath a GitHub project-site subdirectory. User text uses Mustache's HTML escaping; links and theme values pass the shared schemas. The small script uses `textContent`, and no user script or raw HTML is executed. Artifact validation rejects traversal, duplicate paths, unbounded file counts, and oversized output.

## React generator

React templates produce a standalone React/Vite project, exact dependency versions and a matching npm lockfile, source/JSON/CSS, relative asset paths, and a GitHub Pages Actions workflow. Only visible sections and relevant fields enter the public JSON. JSX escapes text and the generated link component validates protocols. The workflow uses Node 22, `npm ci`, a bounded build, a Pages artifact, and a deployment job with Pages/OIDC permissions. Actions are pinned to verified commit SHAs. Generated source is built in GitHub Actions; the GitFolio worker never installs or executes a user's project. The worker manages the dedicated `gitfolio` branch. See [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## GitHub publishing

Normal sign-in still requests only profile/email scopes. The authenticated `/api/auth/github/publish?format=static|react` route explicitly requests `repo` access for Pages and, for React output, `workflow` access. GitHub's Pages REST API requires `repo` for OAuth App tokens; this permission includes private-repository access even though GitFolio publishes only public repositories. The UI explains the grant before redirecting. One-time state/PKCE also binds publishing consent to the current GitHub account; switching accounts cannot replace its credentials. See [Pages REST permissions](https://docs.github.com/en/rest/pages/pages) and [OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

The provider revalidates token identity and requires a public repository owned/administered by that account. New repositories use a project-specific description and a dedicated `gitfolio` default branch. Existing repositories require a matching `.gitfolio.json` project marker. The only recovery exception is a repository bearing that exact creation marker and still containing just its initial README. Unrelated/private/archived repositories, another project's marker, custom domains, and changed managed default branches are rejected.

Commits use a base tree, preserve unmanaged files, remove only prior generated paths recorded in the validated manifest, and update refs with `force: false`. The manifest and commit message make retrying the same deployment after a lost response idempotent. Pages settings change after the commit succeeds. Static output uses branch publishing; React uses explicit workflow dispatches. Only a successful build for the exact commit yields `LIVE`; a URL alone is insufficient. Publishing does not follow arbitrary URLs or fetch custom-domain content. API errors and logs omit provider bodies and tokens. Tests use a simulated GitHub transport; live repository creation and Pages publishing remain a separate verification step.
