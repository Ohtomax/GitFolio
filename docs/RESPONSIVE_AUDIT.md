# Responsive audit

Verified locally on November 18, 2026 with the production Vite build and Microsoft Edge through Playwright.

| Area | Checked |
| --- | --- |
| Workspace | Dashboard, account, settings dialog, template selection, project details, editor, publishing |
| Widths | 320, 375, 768, 1280, and 1600 CSS pixels |
| Sign-in | Login and safe OAuth error recovery at 320, 375, 768, and 1280 pixels |
| Text sizing | Login at 200% root text size, with a keyboard focus indicator on sign-in |
| Content stress | Maximum-length project name, long repository name, display name, and email address |
| Dialogs | Settings remain within the viewport and close with Escape |
| Portfolio layouts | Separate template suites cover the original five designs and the five role designs, including narrow editor previews and exported sites |

The audit found and fixed a long-email overflow in the connected-account card. The avatar now retains its size while the account text wraps within its column. Representative mobile account and setup screenshots were visually inspected. Horizontal filter scrolling stays inside its own control; the page does not scroll sideways.

Run the audit against a running client after building it:

```powershell
$env:GITFOLIO_BROWSER_BASE_URL = 'http://127.0.0.1:4173'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node --test client/test/browser/responsive.test.mjs
```

Start the preview separately with `npm run preview --workspace=@gitfolio/client -- --host 127.0.0.1 --port 4173`. Set `GITFOLIO_AUDIT_SCREENSHOTS` to an ignored local directory to retain screenshots. A normal dependency installation supplies Playwright; install its Chromium browser or select an installed browser channel.

These are reflow, interaction, and representative visual checks. They do not establish a full assistive-technology audit or every browser/device combination.
