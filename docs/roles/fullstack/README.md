# Full-Stack Developer / SaaS & Product

A 12-column SaaS bento layout with an 8/4 hero, product metrics, a three-layer stack map, and a selectable UI-to-API-to-query trace.

Category: developer. Density: comfortable. Fonts: Geist headings/body + Geist Mono trace.

A 12-column SaaS bento layout with an 8/4 hero, product metrics, a three-layer stack map, and a selectable UI-to-API-to-query trace.

## Design tokens

| Token | Hex | Contrast on background / surface |
| --- | --- | --- |
| accent | #A78BFA | 7.13:1 / 6.51:1 |
| background | #0B0D14 | Decorative or canvas |
| text | #F4F5F8 | 17.80:1 / 16.24:1 |
| muted | #9DA4B7 | 7.79:1 / 7.11:1 |
| surface | #141824 | Decorative or canvas |
| border | #2A3047 | Decorative or canvas |
| primary | #C4B5FD | 10.51:1 / 9.59:1 |
| success | #34D399 | 10.10:1 / 9.21:1 |
| warning | #FBBF24 | 11.63:1 / 10.61:1 |
| danger | #F87171 | 7.02:1 / 6.40:1 |

Text/status tokens meet the 4.5:1 normal-text threshold on both preset canvases. Status labels communicate meaning alongside color. Custom themes require fresh contrast checks.

## Content and code

Order: hero → interactive → projects → skills → experience → about → contact.

[portfolio.json](portfolio.json) contains the full editable profile, projects, metrics, tags, and interactive demo data. All people, organizations, and results are fictional examples. Demo widgets are local simulations, and displayed code/SQL is never executed.

The production TSX is in [client/src/components/role-templates](../../../client/src/components/role-templates). Choosing this preset creates an independent draft. Use Preview to enable its widget controls; the advanced demo-data editor validates JSON before applying it. Both export formats use the same React components. React exports include typed source, Tailwind configuration, locked dependencies, and the existing GitHub Actions workflow.
