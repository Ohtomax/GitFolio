# Frontend Developer / Interface Craft

A contemporary interface portfolio with a reactive canvas, a live component-state lab, and an explicit performance budget.

Category: developer. Density: spacious. Fonts: Geist headings/body + Geist Mono labels.

A wide typographic hero, a live component stage, performance scorecards, and a compact project gallery with reduced-motion transitions.

## Design tokens

| Token | Hex | Contrast on background / surface |
| --- | --- | --- |
| accent | #B8A0FF | 8.90:1 / 8.30:1 |
| background | #0B0B0F | Decorative or canvas |
| text | #F5F5F7 | 18.04:1 / 16.83:1 |
| muted | #ADADB9 | 8.84:1 / 8.25:1 |
| surface | #14141B | Decorative or canvas |
| border | #34333F | Decorative or canvas |
| primary | #80EAD7 | 13.72:1 / 12.80:1 |
| success | #7BE7B1 | 13.01:1 / 12.14:1 |
| warning | #F0CD77 | 12.82:1 / 11.96:1 |
| danger | #FFA3B6 | 10.45:1 / 9.75:1 |

Text/status tokens meet the 4.5:1 normal-text threshold on both preset canvases. Status labels communicate meaning alongside color. Custom themes require fresh contrast checks.

## Content and code

Order: hero → interactive → projects → skills → experience → about → contact.

[portfolio.json](portfolio.json) contains the full editable profile, projects, metrics, tags, and interactive demo data. All people, organizations, and results are fictional examples. Demo widgets are local simulations, and displayed code/SQL is never executed.

The production TSX is in [client/src/components/role-templates](../../../client/src/components/role-templates). Choosing this preset creates an independent draft. Use Preview to enable its widget controls; the advanced demo-data editor validates JSON before applying it. Both export formats use the same React components. React exports include typed source, Tailwind configuration, locked dependencies, and the existing GitHub Actions workflow.
