# Project management

Phase 3 adds a template catalog and owner-scoped portfolio projects. Authentication uses the existing Phase 2 JWT/session middleware.

## Templates

The API seeds ten designs at startup: Modern Minimalist (minimal), Terminal (developer/React), Editorial (professional), Bento (creative), Executive (professional/React), and five role-specific React templates for Backend, Cybersecurity, UI/UX & QA, Frontend, and Full-Stack work. See [Portfolio templates](PORTFOLIO_TEMPLATES.md) and [Role templates](ROLE_PORTFOLIO_TEMPLATES.md) for exact tokens, full sample content, and accessibility/design decisions. Every template has a validated theme and ordered starter sections. No GitHub repository or published site is created by selecting a template.

Stable template IDs, `skipDuplicates`, and conditional legacy-fingerprint updates make seeding repeatable. Untouched old catalog rows are upgraded; custom catalog edits and existing project theme/content snapshots are preserved. To seed without running the API, use `npm run db:seed` after applying migrations. The seed command needs PostgreSQL and does not require Redis to connect.

Both `GET /api/templates` and `GET /api/templates/:id` require authentication. Lists accept `page`, `pageSize` (maximum 50), and optional `category`; results contain `items`, `total`, `page`, `pageSize`, and `totalPages`. Lists exclude section defaults and include only a validated `preview` theme alongside metadata; detail requests include validated `defaultConfig`. Project summaries use their own saved preview theme so legacy drafts keep their original appearance.

Template categories are `minimal`, `developer`, `professional`, and `creative`. Theme defaults contain `colors` (`accent`, `background`, `text`), `font` (`sans`, `serif`, `mono`), and `spacing` (`compact`, `comfortable`, `spacious`). Each starter section has a type, heading/description content, and visibility.

## Project API

All `/api/projects` routes require a verified JWT/session. The owner ID comes exclusively from the session; request bodies cannot supply an owner. Reads and writes include owner predicates in the Prisma query. Another owner's project returns the same 404 as a missing project.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/projects` | Paginated owner-only list; optional `search`, `status`, and `sort` (`updated` or `name`) |
| POST | `/api/projects` | Accepts `name`, `slug`, `templateId`, and optional nullable `repoName`; copies theme and ordered sections atomically from validated template defaults |
| GET | `/api/projects/:id` | Returns owned project metadata, theme, and up to 50 ordered sections |
| PATCH | `/api/projects/:id` | Updates name, slug, repository name, or draft/archive state; does not change template or section content |
| DELETE | `/api/projects/:id` | Deletes the owned project and cascading database records; does not delete a GitHub repository |

Lists use the same pagination envelope as templates, with a maximum page size of 50. Slugs are lowercase, use single hyphens, and are unique per owner. Duplicate slugs return `409 PROJECT_SLUG_TAKEN`. Editing is covered by the [portfolio editor](PORTFOLIO_EDITOR.md); publishing is covered by the [deployment engine](DEPLOYMENT_ENGINE.md). Project creation copies defaults into independent JSON/section records rather than linking mutable template content. Phase 3 needs no new migration; Phases 4 and 5 add revisions and deployment persistence.

## Client data layer

`useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, and `useDeleteProject` use the validated project service and same-origin `apiFetch`. `useTemplates` and `useTemplate` load the catalog and selected defaults. Queries use five-minute freshness and forward cancellation signals. Project query keys include the signed-in user's ID; pagination placeholders are reused only within the same owner. Successful mutations invalidate list queries and update/remove relevant details. A mutation completing after sign-out cannot repopulate user caches. The auth flow continues to clear all query data on sign-in/sign-out.

## Dashboard

Successful sign-in defaults to `/dashboard`; explicit protected return destinations are preserved. The dashboard lists six projects per page, searches by name, filters by status, and sorts by update time/name using the API. Empty, loading, error/retry, and mobile states are provided. **Edit** opens the editor, **Publish** opens deployment history and publishing controls, and **Manage** opens metadata settings. Archive/restore retain content; delete requires confirmation. GitHub repositories/sites are kept when a GitFolio project is archived or deleted. `/account` remains available from workspace navigation.

## Creating a project

`/projects/new` is protected by AuthGuard. Choose a catalog template, then enter a name, unique slug, and optional future repository name. Slug/repository suggestions follow the name until manually edited. The client and API validate the same shared schemas; duplicate slugs display a recoverable error and preserve the form. Creation returns to the dashboard and invalidates its list. Template loading/failure/empty states are handled, and creating is disabled while selected defaults are unavailable. The endpoint creates a local draft with copied sections/theme; it does not create a GitHub repository or publish a site.

## Verification

`npm test` covers seeded defaults, repeated seeding, request validation, ownership across CRUD operations, CSRF checks, conflict responses, query partitioning/invalidation, and logout races. `npm run test:browser --workspace=@gitfolio/client` covers the rendered workflow with synthetic HTTP responses, including template selection, keyboard controls, creation, reload, updates, archiving/restoring, confirmed deletion, pagination/search, errors, and narrow screens. See README for browser prerequisites.

The optional real-storage test requires `GITFOLIO_TEST_DATABASE_URL` pointing to a migrated disposable database whose name starts with `gitfolio_phase1_test_`. It verifies the actual Prisma repositories, uniqueness, owner constraints, section creation/cascades, and repeated seeding. Browser fixtures do not establish real PostgreSQL/Redis persistence or GitHub OAuth consent. Existing local credentials and user records are never replaced by test fixtures.
