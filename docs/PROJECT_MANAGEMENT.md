# Project management

Phase 3 adds a template catalog and owner-scoped portfolio projects. Authentication uses the existing Phase 2 JWT/session middleware.

## Templates

The API seeds four starter templates at startup: Canvas (minimal), Terminal (developer/React), Editorial (professional), and Studio (creative). Every template has a validated theme and ordered starter sections. No GitHub repository or published site is created by selecting a template.

Stable template IDs and `skipDuplicates` make seeding repeatable while preserving existing catalog edits and project references. To seed without running the API, use `npm run db:seed` after applying migrations. The seed command needs PostgreSQL and does not require Redis to connect.

Both `GET /api/templates` and `GET /api/templates/:id` require authentication. Lists accept `page`, `pageSize` (maximum 50), and optional `category`; results contain `items`, `total`, `page`, `pageSize`, and `totalPages`. Lists exclude full defaults; detail requests include validated `defaultConfig`.

Template categories are `minimal`, `developer`, `professional`, and `creative`. Theme defaults contain `colors` (`accent`, `background`, `text`), `font` (`sans`, `serif`, `mono`), and `spacing` (`compact`, `comfortable`, `spacious`). Each starter section has a type, heading/description content, and visibility.
