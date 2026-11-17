# Portfolio editor

Open a project's **Edit** link on the dashboard to reach `/projects/:id/edit`. The lazy-loaded route uses AuthGuard and the owner-scoped project detail API. Its responsive layout has section navigation, a canvas, and a property panel, with explicit loading/error/empty states. Archived projects are identified in the workspace.

The Phase 4 checklist tracks section editing, theme controls, preview, undo/redo, and autosave separately as each capability is implemented. Publishing remains Phase 5.

## Editor state

Each authenticated project workspace creates its own non-persistent Zustand store. Drafts are cloned from server state; document edits never mutate query-cache objects. Undo/redo preserves section selection, coalesces typing within 750 ms, and retains at most 50 history frames. New edits clear the redo branch. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y are supported. Acknowledging a saved snapshot updates the baseline without replacing edits made afterward.
