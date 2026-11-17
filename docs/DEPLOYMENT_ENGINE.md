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
