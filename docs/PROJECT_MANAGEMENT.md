# Project management

Phase 3 adds a template catalog and owner-scoped portfolio projects. Authentication uses the existing Phase 2 JWT/session middleware.

## Templates

The API seeds four starter templates at startup: Canvas (minimal), Terminal (developer/React), Editorial (professional), and Studio (creative). Every template has a validated theme and ordered starter sections. No GitHub repository or published site is created by selecting a template.

Stable template IDs and `skipDuplicates` make seeding repeatable while preserving existing catalog edits and project references. To seed without running the API, use `npm run db:seed` after applying migrations. The seed command needs PostgreSQL and does not require Redis to connect.

Both `GET /api/templates` and `GET /api/templates/:id` require authentication. Lists accept `page`, `pageSize` (maximum 50), and optional `category`; results contain `items`, `total`, `page`, `pageSize`, and `totalPages`. Lists exclude full defaults; detail requests include validated `defaultConfig`.

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

Lists use the same pagination envelope as templates, with a maximum page size of 50. Slugs are lowercase, use single hyphens, and are unique per owner. Duplicate slugs return `409 PROJECT_SLUG_TAKEN`. `PUBLISHED` is read-only in Phase 3; publishing and section/theme editing belong to later phases. Project creation copies defaults into independent database JSON/section records rather than linking mutable template content. No new schema migration is needed for Phase 3; the foundation already defines these tables.

## Client data layer

`useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, and `useDeleteProject` use the validated project service and same-origin `apiFetch`. `useTemplates` and `useTemplate` load the catalog and selected defaults. Queries use five-minute freshness and forward cancellation signals. Project query keys include the signed-in user's ID; pagination placeholders are reused only within the same owner. Successful mutations invalidate list queries and update/remove relevant details. A mutation completing after sign-out cannot repopulate user caches. The auth flow continues to clear all query data on sign-in/sign-out.
