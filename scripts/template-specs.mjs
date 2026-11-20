import { mkdirSync, writeFileSync } from 'node:fs';
import { BUILTIN_TEMPLATES as ALL_TEMPLATES, isRoleLayout, contrastRatio, portfolioVariables } from '../packages/shared/dist/index.js';
const BUILTIN_TEMPLATES = ALL_TEMPLATES.filter((template) => !isRoleLayout(template.defaultConfig.theme.layout));

const root = new URL('../docs/templates/', import.meta.url);
mkdirSync(root, { recursive: true });
const intents = {
  minimal: ['Frontend and full-stack engineers', 'A broad impact hero, two-column project gallery, skills tag cloud, paired career entries, split About, and a simple direct-contact close. Quiet 8px cards and deliberate whitespace.'],
  terminal: ['Systems, infrastructure, DevOps, and security engineers', 'A compact command-line session, dated experience log, repository grid, tools inventory, and a local command-based contact form. Prompts and window chrome carry the identity.'],
  editorial: ['Engineering managers, writers, researchers, and architects', 'A narrow reading column with a serif narrative, numbered case-study essays, dated publications, an understated CV, and a letter-like contact close.'],
  bento: ['Design engineers, creative developers, and interactive designers', 'An asymmetric 12-column composition: large identity tile, focus/music widgets, visual project gallery, stack tile, career tile, and a vivid connect tile.'],
  executive: ['Technical leaders, enterprise consultants, and fractional CTOs', 'A persistent identity/navigation rail, decisive value proposition, semantic architecture table, career timeline, advisory capabilities, and a consultation CTA.'],
  monochrome: ['Developers and students building a personal online CV', 'Inspired by the owner-supplied OnlineCv reference: black-and-white typography, a two-column hero, an editable portrait with initials fallback, a viewport-sized constellation background, a scrolling toolkit strip, glass project cards, biography, skills, career entries, certificates, and a direct-contact close. Motion follows the reference with staggered entrances, shimmering headings, an editable looping typewriter, floating portrait, rotating rings, scan line, breathing glow, mouse-following spotlight and card tilt, repeated scroll reveals, and staggered toolkit chips. The sticky header offers Pause motion. Effects run only in interactive previews and exports, follow live reduced-motion preferences, and stop when their area or the document is hidden. Content and native mobile navigation remain available without JavaScript.'],
  dossier: ['Cybersecurity analysts, detection engineers, and incident responders', 'A neon-green terminal dashboard with a persistent identity rail, numbered section navigation, evidence-oriented case cards, defensive capabilities, career entries, learning records, research notes, and contact links. Interactive previews and exports switch between sections; the editor and no-JavaScript output keep all sections readable. The reference informed the visual treatment only; all example data is original.'],
  obsidian: ['Full-stack developers, independent builders, and technical writers', 'A Premium developer journal inspired by kroszborg.co: a floating navigation dock, sticky profile with an optional portrait and initials fallback, native expandable experience entries, two-column project and writing cards, biography, tools, personal links, and contact. Interactive previews and both exports add drifting contour and glow layers, staggered profile entrances, a glowing portrait, a blinking role caret, scroll reveals, and mouse-driven artwork depth. Pause motion and live reduced-motion support control the effects; continuous animation pauses off screen and when the tab is hidden. The editing canvas and thumbnails stay still. The profile stacks above the content on mobile. All sample identities and work are original fictional examples; project art and the background use CSS. Navigation and disclosures work without JavaScript.'],
  kinetic: ['Designers, creative developers, and independent studios', 'A Premium portfolio with oversized geometric type, an original CSS orbital sculpture, full project scenes, biography, capabilities, career entries, notes, and contact. Scrolling moves oversized project lettering horizontally while artwork and floating badges travel at different speeds. Interactive previews and both exports also add staggered introductory text, scroll reveals, a moving toolkit, floating artwork, and pointer depth. A sticky header keeps Pause motion reachable; live reduced-motion support disables movement. The effects follow both the nested preview scroll area and normal page scrolling. Editing canvases, thumbnails, and no-JavaScript output remain still and readable.'],
};
const names = { hero: 'Hero', about: 'About', projects: 'Projects', experience: 'Experience', skills: 'Skills', contact: 'Contact', writing: 'Writing', now: 'Now', education: 'Education' };
const specFilename = (template) => {
  const layout = template.defaultConfig.theme.layout;
  const original = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === layout);
  const slug = template.id === original.id ? layout : template.name.replace(/^The\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${slug}.md`;
};
for (const template of BUILTIN_TEMPLATES) {
  const { theme, sections } = template.defaultConfig;
  const [persona, composition] = intents[theme.layout];
  const vars = portfolioVariables(theme);
  const lines = [`# ${template.name}`, '', `Category: \`${template.category}\` · Audience: ${persona} · Output: ${template.isReact ? 'React with GitHub Actions' : 'static HTML/CSS/JS'}`, '', template.description, '', composition, '', '## Design tokens', '', '| Token | Exact value |', '| --- | --- |',
    ...Object.entries(theme.colors).map(([key, value]) => `| ${key} | \`${value}\` |`),
    `| Body family | ${vars['--pf-font']} |`, `| Heading family | ${vars['--pf-heading-font']} |`, `| Font styles | body: ${theme.font}; heading: ${theme.headingFont ?? theme.font} |`, `| Density | ${theme.spacing} |`, '',
    'Text, muted text, and accent contrast against the background / card surface:', '', '| Foreground | Background | Surface |', '| --- | --- | --- |',
    ...['text','muted','accent'].map((key) => `| ${key} | ${contrastRatio(theme.colors[key],theme.colors.background).toFixed(2)}:1 | ${contrastRatio(theme.colors[key],theme.colors.surface).toFixed(2)}:1 |`), '',
    'The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.', '',
    '## Default content and order', '', sections.map((s) => names[s.type]).join(' → '), '', 'All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.', ''];
  sections.forEach((section, index) => {
    const c = section.content;
    lines.push(`### ${index+1}. ${names[section.type]} — ${c.heading}`, '');
    if(c.eyebrow) lines.push(`Eyebrow: ${c.eyebrow}`, '');
    if(c.subtitle) lines.push(`Subtitle: ${c.subtitle}`, '');
    if(c.portraitUrl) lines.push(`Portrait: ${c.portraitUrl}`, '');
    if(c.portraitAlt) lines.push(`Portrait description: ${c.portraitAlt}`, '');
    if(c.description) lines.push(c.description, '');
    if(c.tags?.length) lines.push(`Tags: ${c.tags.join(' · ')}`, '');
    if(c.metrics?.length) lines.push(...c.metrics.map((m) => `- **${m.value}** — ${m.label}`), '');
    c.items?.forEach((item) => {
      lines.push(`- **${item.title}**${item.subtitle ? ` — ${item.subtitle}` : ''}`, ...(item.description ? [`  ${item.description}`] : []), ...(item.tags?.length ? [`  Stack: ${item.tags.join(' · ')}`] : []), ...(item.url ? [`  Link: ${item.url}`] : []), ...(item.visual ? [`  Decorative cover: ${item.visual}`] : []));
    });
    if(c.items?.length) lines.push('');
    if(c.buttonLabel) lines.push(`CTA: [${c.buttonLabel}](${c.buttonUrl})`, '');
  });
  writeFileSync(new URL(specFilename(template), root), lines.join('\n').trimEnd()+'\n');
}
writeFileSync(new URL('../docs/portfolio-templates.json', import.meta.url), JSON.stringify(ALL_TEMPLATES, null, 2)+'\n');
const index = `# GitFolio portfolio templates

${BUILTIN_TEMPLATES.length} presets across ${new Set(BUILTIN_TEMPLATES.map((template) => template.defaultConfig.theme.layout)).size} design families for different kinds of technical work. Choose one in **New project**; the picker, editor, static output, and React output share a semantic renderer and styles. Variants reuse their family's composition with their own palette, type pairing, content, and density.

${BUILTIN_TEMPLATES.map((t) => `- [${t.name}](templates/${specFilename(t)}) — ${t.description}`).join('\n')}

The linked specifications contain exact tokens, measured palette contrast, section order, and every default heading, description, entry, link, metric, and CTA. [Machine-readable specifications](portfolio-templates.json) mirror the canonical definitions in packages/shared/src/portfolio. After editing a preset, build the shared workspace and run **node scripts/template-specs.mjs** to refresh the documents.

## Research and design decisions

- [Vercel Geist](https://vercel.com/geist/introduction) informed the emphasis on clear type and high-contrast foundations. The minimalist composition is original.
- [Linear’s UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) describes reducing visual noise while strengthening hierarchy and alignment. Those principles inform the executive information structure and controlled density.
- [Brittany Chiang’s portfolio](https://brittanychiang.com/) demonstrates the value of dated experience and work evidence with technology context. These templates use original biographies and sample work.
- ReadCV and Bento.me are historical style references supplied in the brief. Their current pages were inaccessible during research; no live review or copied layout is claimed.
- [The owner's OnlineCv portfolio](https://ohtomax.github.io/OnlineCv/) is the requested reference for Monochrome / Online CV. The reusable preset follows its composition and movement: staggered hero entrances, shimmering headings, a typing/deleting subtitle, floating portrait, rotating rings, scan line, breathing glow, cursor-connected particles and spotlight, card tilt and lighting, scrolling ticker, repeated scroll reveals, and staggered toolkit chips. Content remains editable and illustrative, with an optional portrait URL and locally bundled Geist, Manrope, and Geist Mono fonts. Effects run in interactive previews and both exports; Canvas and thumbnails stay still. The sticky header offers Pause motion, system reduced-motion changes apply immediately, and continuous work stops when its area or the document is hidden. Content and native mobile navigation remain available without JavaScript.
- [The supplied terminal portfolio](https://trusttheguardian.github.io/portfolio_of_jason/) informed Sentinel / Cybersecurity Dossier's dark dashboard, green accents, and sidebar navigation. Its identity, biography, projects, photographs, contact details, and credentials are not reused. Nadia Serrano, the organizations, lab investigations, and learning records are original fictional examples. The mobile menu uses native details controls; section switching is a progressive enhancement, so all content remains readable without JavaScript. The scanline texture is static.
- [Joonas Sandell's portfolio](https://joonassandell.com/) is the requested visual reference for Kinetic / Animated Portfolio: generous typography, large project presentations, oversized project lettering, and artwork that travels at different speeds while scrolling. Kinetic adds horizontal lettering movement, layered parallax, floating badges, and full-scene project links. Riley Vale, the project concepts, biography, career entries, and contact links are original fictional examples. The artwork is original CSS, not copied photographs or project assets. Kinetic belongs to the Premium gallery category. Animation runs only in interactive previews and exports; continuous effects pause outside their viewport and when the document is hidden. The scroll effects respond to the preview's scroll area and the exported page without intercepting native scrolling. Visitors can pause motion from the sticky header, and changes to the system's reduced-motion preference take effect immediately.
- [WCAG contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) defines the 4.5:1 normal-text threshold used in the automated palette checks.
- [The supplied kroszborg.co portfolio](https://www.kroszborg.co/) informed Obsidian / Developer Journal's dark palette, floating navigation, sticky profile, expandable experience, and project and writing cards. The original identity, project screenshots, personal information, background artwork, and assistant are not included. Alex Morgan and all sample work are fictional. Portraits, links, text, tools, and entries remain editable. The template uses native links and details controls in previews and both exports; it does not require a live activity service or an AI backend.

Layouts collapse in source order at narrow container widths. They use semantic headings, navigation and skip links, visible keyboard focus, safe external links, and reduced-motion support. Fonts are bundled locally with their SIL Open Font Licenses; uncovered scripts use system fallbacks. Project cover graphics are decorative original CSS compositions, not invented product screenshots. Contact links are usable without JavaScript. Terminal commands are local help/email/links/clear utilities; the Bento focus widgets use native details controls and do not pretend to stream live music.

## Updating an existing installation

Run **npm run db:seed** after building. Stable catalog IDs preserve project references. The seeder upgrades a built-in row only when its complete metadata and default JSON still match the untouched legacy version. Custom catalog edits are preserved; when an edited legacy row occupies a preset ID, the new design is added under a second reserved ID so all five archetypes remain available. Existing project content and theme snapshots are never rewritten: themes without an explicit layout continue using the classic renderer. No database migration is needed for these JSON fields.

For newly created portfolios, replace the sample identity, links, organizations, and metrics through the editor. Writing, Now widgets, tags, metrics, cover graphics, font pairing, muted text, card surfaces, and borders are editable. Remove the illustrative-content footer only after replacing the examples. Publication still uses the existing deployment confirmation and GitHub authorization flow; no portfolio is published by seeding or choosing a template.

These designs support a clear path from introduction to work evidence and contact. Conversion improvements have not been measured and are not claimed.

## Validation

The original five designs were verified locally on 2026-11-18: all workspace builds and type checks; 70 backend tests with disposable PostgreSQL/Redis services; 28 client unit tests; and 50 browser tests. Coverage included their creation flows, editor save/reload, rich fields, keyboard controls, legacy draft preservation, edited catalog rows, safe URLs, hidden-content omission, palette contrast, and reflow from 320px to 1440px. Each original generated React project also built independently and matched its static counterpart in a browser at desktop/mobile widths, including edits made directly to portfolio.json. GitHub publishing was not invoked for that design task.

When adding presets, rerun workspace builds and type checks, the catalog and export tests, and client/test/browser/templates.test.mjs. The tests iterate over every non-role preset, including variants that share a renderer, and check their own preview content, saved defaults, exports, controls, and narrow-screen reflow. Regenerating this document alone does not verify a new preset.
`;
writeFileSync(new URL('../docs/PORTFOLIO_TEMPLATES.md', import.meta.url),index);
