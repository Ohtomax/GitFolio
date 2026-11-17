# Portfolio editor

Open a project's **Edit** link on the dashboard to reach `/projects/:id/edit`. The lazy-loaded route uses AuthGuard and the owner-scoped project detail API. Its responsive layout has section navigation, a canvas, and a property panel, with explicit loading/error/empty states. Archived projects are identified in the workspace.

All six Phase 4 checklist items are implemented and committed separately. Publishing remains Phase 5.

## Editor state

Each authenticated project workspace has its own Zustand store. Drafts are cloned from server state; document edits never mutate query-cache objects. Undo/redo preserves section selection, coalesces typing within 750 ms, and retains at most 50 history frames. New edits clear the redo branch. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y are supported. Acknowledging a saved snapshot updates the baseline without replacing edits made afterward.

## Sections and document persistence

Add any of seven section types, reorder with accessible up/down buttons, toggle visibility, edit headings/body text and calls to action, and manage entries for project/skill/experience/education sections. Drafts support at most 50 sections and 20 entries per section. Text renders through React escaping; links accept only HTTP(S) and simple mailto addresses, without embedded credentials. Empty documents are supported.

Apply the `20261118000000_editor_revision` migration with `npm run db:deploy` before using editor saves. `PATCH /api/projects/:id/editor` requires the existing JWT/session and frontend Origin for cookie writes. Its strict body contains `baseRevision`, `themeConfig`, and ordered sections. The server assigns sort positions, rejects duplicate/foreign section IDs and archived projects, and applies the entire document in a transaction. A conditional revision increment prevents stale writes; conflicts return `409 EDITOR_CONFLICT`. Saving does not modify project ownership, slug, or template.

Manual **Save changes** acknowledges the submitted snapshot without overwriting newer local edits. Save requests are serialized. **Reload saved version** asks before discarding local changes and resets the revision/history only after a successful server read. A conflict requires reloading; the client never forces an overwrite. The request schema bounds document size below the API's JSON limit.

## Autosave and recovery

After 800 ms without an edit, the workspace saves through a TanStack Query mutation. Further changes are queued behind the in-flight request, using its acknowledged revision. Status distinguishes pending edits, saving, acknowledged saves, and failures. Failed requests retain the local document and stop automatic retries; **Retry save** submits it again. A revision conflict pauses saves until an explicit reload. A response lost after a committed save can cause a conflict on retry; reloading reads the authoritative saved document without forcing an overwrite.

Internal links and browser back/forward navigation are blocked while a draft is dirty. **Stay here** keeps editing; **Leave editor** discards the unsaved local draft. Sign-out asks the same kind of confirmation, and page refresh/close uses the browser's native unsaved-change prompt. Archived projects remain read-only and do not autosave.

Unexpected workspace unmounts retain up to five recent dirty drafts in memory, partitioned by authenticated owner and project. Returning within the same loaded page offers **Resume draft**, which checks the current server revision before restarting autosave, or **Reload saved version** to discard it. A late acknowledgement updates only the original draft. Confirmed departures discard it. Drafts and history are not stored in localStorage/sessionStorage and do not survive page reloads, browser closure, or a full navigation through GitHub. This is not offline storage or persistent revision recovery; save or copy important unsaved content before leaving the page.

## Theme

The Theme panel edits accent/background/text colors, three local font families, and compact/comfortable/spacious section spacing. A sample updates immediately. These edits participate in undo/redo and the same document-save transaction as sections. **Use template defaults** restores the selected template's theme without changing content. Custom colors are strictly validated hex values and are applied through scoped CSS variables; font/spacing choices use fixed class maps, and no remote font requests are needed. Accent buttons select black/white text for contrast.

## Live preview

Canvas and Preview use the same document renderer for all seven section types, including entries, calls to action, theme styling, and visibility. Canvas provides section selection; Preview enables validated external links in new tabs and section navigation. Desktop fits the available workspace; tablet and mobile cap the pane at 768px and 375px. Container queries adapt cards and typography to the pane's actual width. The preview uses deferred rendering to keep typing responsive. Text is escaped by React, and invalid links in a local draft never become clickable. No portfolio scripts or raw HTML execute in the preview.

## Verification

Unit/HTTP suites cover strict schemas, ownership, rollback, archived documents, undo/redo, acknowledgement races, owner-partitioned interrupted drafts, and serialized saves. Browser tests use synthetic API responses to verify the rendered controls, persistence across reload, safe preview, narrow screens, debounce, in-flight edits, retry/conflict recovery, and navigation protection. The optional `editor-storage.test.mjs` uses a migrated disposable PostgreSQL database to exercise real transactions, concurrent tabs, section creation timestamps, removal/restore, and foreign-ID rollback. See README for service/browser prerequisites. A passing isolated database test does not migrate the configured development database or verify live GitHub consent.
