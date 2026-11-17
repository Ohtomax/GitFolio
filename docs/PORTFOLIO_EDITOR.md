# Portfolio editor

Open a project's **Edit** link on the dashboard to reach `/projects/:id/edit`. The lazy-loaded route uses AuthGuard and the owner-scoped project detail API. Its responsive layout has section navigation, a canvas, and a property panel, with explicit loading/error/empty states. Archived projects are identified in the workspace.

The Phase 4 checklist tracks section editing, theme controls, preview, undo/redo, and autosave separately as each capability is implemented. Publishing remains Phase 5.

## Editor state

Each authenticated project workspace creates its own non-persistent Zustand store. Drafts are cloned from server state; document edits never mutate query-cache objects. Undo/redo preserves section selection, coalesces typing within 750 ms, and retains at most 50 history frames. New edits clear the redo branch. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y are supported. Acknowledging a saved snapshot updates the baseline without replacing edits made afterward.

## Sections and document persistence

Add any of seven section types, reorder with accessible up/down buttons, toggle visibility, edit headings/body text and calls to action, and manage entries for project/skill/experience/education sections. Drafts support at most 50 sections and 20 entries per section. Text renders through React escaping; links accept only HTTP(S) and simple mailto addresses, without embedded credentials. Empty documents are supported.

Apply the `20261118000000_editor_revision` migration with `npm run db:deploy` before using editor saves. `PATCH /api/projects/:id/editor` requires the existing JWT/session and frontend Origin for cookie writes. Its strict body contains `baseRevision`, `themeConfig`, and ordered sections. The server assigns sort positions, rejects duplicate/foreign section IDs and archived projects, and applies the entire document in a transaction. A conditional revision increment prevents stale writes; conflicts return `409 EDITOR_CONFLICT`. Saving does not modify project ownership, slug, or template.

Manual **Save changes** acknowledges the submitted snapshot without overwriting newer local edits. Save requests are serialized. **Reload saved version** asks before discarding local changes and resets the revision/history only after a successful server read. A conflict requires reloading; the client never forces an overwrite. The request schema bounds document size below the API's JSON limit.

## Theme

The Theme panel edits accent/background/text colors, three local font families, and compact/comfortable/spacious section spacing. A sample updates immediately. These edits participate in undo/redo and the same document-save transaction as sections. **Use template defaults** restores the selected template's theme without changing content. Custom colors are strictly validated hex values and are applied through scoped CSS variables; font/spacing choices use fixed class maps, and no remote font requests are needed. Accent buttons select black/white text for contrast.

## Live preview

Canvas and Preview use the same document renderer for all seven section types, including entries, calls to action, theme styling, and visibility. Canvas provides section selection; Preview enables validated external links in new tabs and section navigation. Desktop fits the available workspace; tablet and mobile cap the pane at 768px and 375px. Container queries adapt cards and typography to the pane's actual width. The preview uses deferred rendering to keep typing responsive. Text is escaped by React, and invalid links in a local draft never become clickable. No portfolio scripts or raw HTML execute in the preview.
