# Build and publish your first portfolio

GitFolio turns a saved portfolio draft into a public GitHub Pages site. Your draft belongs to your signed-in account. Publishing creates or updates files in a public repository, so review every section before confirming a deployment.

## 1. Connect your account

Open GitFolio and select **Continue with GitHub**. Approve access to your profile and email. Use the GitHub account that should own your portfolio repository. GitFolio does not receive your GitHub password.

You arrive at **Your projects**. The account icon shows your connected GitHub profile; the sign-out icon ends your GitFolio session. If sign-in is cancelled or expires, return to the sign-in page and start a new attempt. Avoid reusing an old callback link.

For a local installation, use the exact `http://localhost:5173` address after following [local setup](../README.md#local-setup). The operator must configure the OAuth App first; a successful configuration check does not prove a live sign-in.

## 2. Choose a starting point

Select **New project**. There are ten built-in styles, across four category filters. Use **Next templates** if a style is on another page.

| Style | Best starting point for |
| --- | --- |
| Modern Minimalist | Clear project stories, impact, and a concise technology stack |
| Terminal / Cyberpunk | A compact command-line identity and engineering experience |
| Editorial / Thought Leader | Writing, research, and narrative case studies |
| Bento / Creative Technologist | Visual work, quick links, and modular highlights |
| Enterprise / Executive | Advisory work, architecture, and career milestones |
| Backend Engineer / System Architecture | Infrastructure evidence and a sample API inspector |
| Cybersecurity / Threat Intel & Audit | Research and searchable audit findings |
| UI/UX & QA / Design Systems and Quality | Before/after work, design tokens, and quality evidence |
| Frontend Developer / Interface Craft | Interface work and an interactive component-state demo |
| Full-Stack Developer / SaaS & Product | Product outcomes and a UI-to-API-to-query walkthrough |

The five role styles use React output; output format follows the chosen template. The picker labels each style **Static** or **React**. See the [original design specifications](PORTFOLIO_TEMPLATES.md) and [role specifications](ROLE_PORTFOLIO_TEMPLATES.md) for full sample content.

Select a style and **Continue**. Enter a project name, a unique lowercase slug, and an optional repository name. Suggestions follow your project name until you edit them. A slug belongs to your account, so someone else's matching slug does not block yours. **Create project** saves a draft and returns to the dashboard. It does not publish anything or create a GitHub repository.

## 3. Make the content yours

Select **Edit** on your project. The editor contains section navigation, a preview canvas, and a property panel. On narrower screens the panels stack vertically; scroll to reach the selected section's controls.

Choose a section in the navigation or canvas. Edit its heading, description, links, entries, and other available fields. Add sections with **Add a section**, reorder with the up/down buttons, or uncheck **Visible in portfolio** to hide one from the public output. **Remove section** removes it from the draft; undo can restore it while the editor is open.

Open **Theme** to adjust colors, heading/body font styles, and spacing. **Use template defaults** resets the theme without replacing your content. Check the text's readability when changing colors. The starter palettes are contrast-checked; arbitrary custom combinations still need your review.

Replace all example identities, company names, links, metrics, certifications, research, and project claims with your own work. Keep the illustrative-content label enabled until the sample content has been replaced. Interactive role demos display saved examples locally: they do not run SQL, send API requests, scan systems, or collect contact submissions. Optional Figma references load an external embed only when you request it; use a publicly shareable file or prototype.

## 4. Save and preview

Edits autosave after an 800 ms pause. Wait for **All changes saved**, or select **Save changes**. A success toast confirms an explicit save; routine autosaves use the status label. **Undo** and **Redo** affect the draft, including theme changes, and do not roll back a published GitHub site.

Switch between **Canvas** and **Preview**. Preview enables the portfolio's links and interactive controls. Desktop, tablet, and mobile buttons change the canvas width, so you can check reflow before publishing. Verify navigation, project links, contact addresses, and every interactive example.

If a preview crashes, **Try preview again** retries it while the editor remains available. A page reload recovers a failed page download, but reloads can discard unsaved content. Copy important unsaved text before reloading.

| Save message | Next step |
| --- | --- |
| All changes saved | The acknowledged version is stored on the server |
| Changes not saved | Keep the editor open, check connectivity, then use **Retry save** |
| Save paused / newer version saved elsewhere | Copy any changes you need, then **Reload saved version**; this discards the local draft after confirmation |
| Recovered unsaved draft | **Resume draft** checks the server revision before autosave resumes |

Recovered drafts exist only in memory within the same loaded page session. They do not survive a reload, browser closure, sign-out, or a full GitHub authorization navigation. Confirming **Leave editor** discards the unsaved draft. Saved project data remains in the database.

## 5. Publish a reviewed version

After saving, select **Publish & history**, or **Publish** from the dashboard. Review the repository, output format, and saved version.

If prompted, select **Authorize publishing**. GitHub requests repository access and, for React builds, workflow access. Repository access includes private repositories even though GitFolio publishes only public repositories it manages. Review the consent screen before approving. Use the same GitHub account; granting permission alone does not publish.

Select **Publish portfolio** and confirm the public repository and saved version. Everything included in that generated source and site is public. Hidden sections are excluded. The version is captured when the deployment starts; edits made afterward belong to a later publish.

Follow **Deployment history**: Queued → Generating → Committing → Publishing → Live. Keep this page open to follow progress. **Open portfolio** appears only after GitHub confirms a successful build for that commit. **View source** opens the repository, and React output can also show **Open build details**.

To update your public site, edit, save, and publish another version. Draft changes leave the previous public site in place until publishing succeeds. A failed attempt stays in history with its safe logs.

## 6. Recover from a publishing problem

| Situation | What to do |
| --- | --- |
| Queued for a long time | Ask the operator whether the publishing worker is running; avoid repeatedly starting attempts |
| Permission or authorization expired | Reconnect publishing access with the same account, then start a new attempt |
| Repository conflict | Choose a new repository name in **Manage**, or have the operator inspect the managed branch; do not overwrite an unrelated repository |
| Build failed | Open the build details, correct the issue, save, and publish again |
| Starting request lost its response | Check history, refresh publishing status, and use **Retry publish request** if offered |
| GitHub unavailable or rate limited | Wait before retrying; your saved draft remains available |
| Service unavailable | Keep unsaved work open and retry after the operator restores the service |

Send feedback with the action, approximate time, project/deployment ID, browser, and a redacted screenshot or request ID if available. Never share OAuth callback URLs, cookies, access tokens, environment files, or private profile data.

## 7. Manage projects and leave the beta

Dashboard search, status filters, sorting, and pagination help find your work. **Manage** changes the project name, slug, repository name, or archive status. Archiving preserves saved content and history but disables editing and new publishing. Restoring returns it to Draft.

**Delete permanently** removes the GitFolio project, its sections, and its deployment history after confirmation. It does not delete the GitHub repository or unpublish the existing site. Manage those separately in GitHub. There is currently no self-service account deletion or arbitrary past-version restore in GitFolio; contact your operator for account-data requests. To remove the app's GitHub access, revoke its OAuth authorization in GitHub settings and sign out of GitFolio.
