# UI/UX & QA / Design Systems and Quality

A considered design-and-quality portfolio with before/after case studies, live design tokens, and readable test evidence.

Category: creative. Density: spacious. Fonts: Manrope headings + Geist body + Georgia specimen option.

A light editorial canvas with paired before/after views, a token workbench, coverage scorecards, and a research-to-shipping narrative.

## Design tokens

| Token | Hex | Contrast on background / surface |
| --- | --- | --- |
| accent | #6D28D9 | 6.57:1 / 7.10:1 |
| background | #F7F6F2 | Decorative or canvas |
| text | #272332 | 14.15:1 / 15.30:1 |
| muted | #625D6B | 5.89:1 / 6.37:1 |
| surface | #FFFFFF | Decorative or canvas |
| border | #D8D2E0 | Decorative or canvas |
| primary | #C24136 | 4.73:1 / 5.12:1 |
| success | #166534 | 6.59:1 / 7.13:1 |
| warning | #854D0E | 6.34:1 / 6.85:1 |
| danger | #B91C1C | 5.98:1 / 6.47:1 |

Text/status tokens meet the 4.5:1 normal-text threshold on both preset canvases. Status labels communicate meaning alongside color. Custom themes require fresh contrast checks.

## Content and code

Order: hero → projects → interactive → skills → experience → about → contact.

[portfolio.json](portfolio.json) contains the full editable profile, projects, metrics, tags, and interactive demo data. All people, organizations, and results are fictional examples. Demo widgets are local simulations, and displayed code/SQL is never executed.

The production TSX is in [client/src/components/role-templates](../../../client/src/components/role-templates). Choosing this preset creates an independent draft. Use Preview to enable its widget controls; the advanced demo-data editor validates JSON before applying it. Both export formats use the same React components. React exports include typed source, Tailwind configuration, locked dependencies, and the existing GitHub Actions workflow.
