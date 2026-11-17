# GitFolio portfolio templates

Five original design families for different kinds of technical work. Choose one in **New project**; the picker, editor, static output, and React output share a semantic renderer and styles. Each preset has a distinct composition, type pairing, content order, density, and contact treatment.

- [The Modern Minimalist](templates/minimal.md) — A precise, spacious portfolio that puts product impact, thoughtful engineering, and shipped work first.
- [The Terminal / Cyberpunk](templates/terminal.md) — A compact, phosphor-lit command-line portfolio for engineers who make complex systems dependable.
- [The Editorial / Thought Leader](templates/editorial.md) — A warm, literary portfolio where considered writing, narrative case studies, and a clear point of view lead the conversation.
- [The Bento / Creative Technologist](templates/bento.md) — An expressive, asymmetric collection of work, experiments, and small personal details for people who design in code.
- [The Enterprise / Executive](templates/executive.md) — A disciplined, evidence-focused portfolio for technical leaders connecting architecture decisions to business outcomes.

The linked specifications contain exact tokens, measured palette contrast, section order, and every default heading, description, entry, link, metric, and CTA. [Machine-readable specifications](portfolio-templates.json) mirror the canonical definitions in packages/shared/src/portfolio. After editing a preset, build the shared workspace and run **node scripts/template-specs.mjs** to refresh the documents.

## Research and design decisions

- [Vercel Geist](https://vercel.com/geist/introduction) informed the emphasis on clear type and high-contrast foundations. The minimalist composition is original.
- [Linear’s UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) describes reducing visual noise while strengthening hierarchy and alignment. Those principles inform the executive information structure and controlled density.
- [Brittany Chiang’s portfolio](https://brittanychiang.com/) demonstrates the value of dated experience and work evidence with technology context. These templates use original biographies and sample work.
- ReadCV and Bento.me are historical style references supplied in the brief. Their current pages were inaccessible during research; no live review or copied layout is claimed.
- [WCAG contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) defines the 4.5:1 normal-text threshold used in the automated palette checks.

Layouts collapse in source order at narrow container widths. They use semantic headings, navigation and skip links, visible keyboard focus, safe external links, and reduced-motion support. Fonts are bundled locally with their SIL Open Font Licenses; uncovered scripts use system fallbacks. Project cover graphics are decorative original CSS compositions, not invented product screenshots. Contact links are usable without JavaScript. Terminal commands are local help/email/links/clear utilities; the Bento focus widgets use native details controls and do not pretend to stream live music.

## Updating an existing installation

Run **npm run db:seed** after building. Stable catalog IDs preserve project references. The seeder upgrades a built-in row only when its complete metadata and default JSON still match the untouched legacy version. Custom catalog edits are preserved; when an edited legacy row occupies a preset ID, the new design is added under a second reserved ID so all five archetypes remain available. Existing project content and theme snapshots are never rewritten: themes without an explicit layout continue using the classic renderer. No database migration is needed for these JSON fields.

For newly created portfolios, replace the sample identity, links, organizations, and metrics through the editor. Writing, Now widgets, tags, metrics, cover graphics, font pairing, muted text, card surfaces, and borders are editable. Remove the illustrative-content footer only after replacing the examples. Publication still uses the existing deployment confirmation and GitHub authorization flow; no portfolio is published by seeding or choosing a template.

These designs support a clear path from introduction to work evidence and contact. Conversion improvements have not been measured and are not claimed.

## Validation

Verified locally on 2026-11-18: all workspace builds and type checks; 70 backend tests with disposable PostgreSQL/Redis services; 28 client unit tests; and 50 browser tests. Coverage includes all five creation flows, editor save/reload, rich fields, keyboard controls, legacy draft preservation, edited catalog rows, safe URLs, hidden-content omission, palette contrast, and reflow from 320px to 1440px. Each generated React project also built independently and matched its static counterpart in a browser at desktop/mobile widths, including edits made directly to portfolio.json. GitHub publishing was not invoked for this design task.
