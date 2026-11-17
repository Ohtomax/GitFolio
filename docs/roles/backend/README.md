# Backend Engineer / System Architecture

A blueprint-led systems portfolio pairing throughput evidence with an interactive API contract inspector.

Category: developer. Density: comfortable. Fonts: Geist + Geist Mono code.

12-column blueprint composition; hero splits 7/5 above 850px, API inspector uses a 230px endpoint rail, and project rows combine ownership with benchmark columns.

## Design tokens

| Token | Hex | Contrast on background / surface |
| --- | --- | --- |
| accent | #7AB8FF | 9.03:1 / 7.98:1 |
| background | #0B1220 | Decorative or canvas |
| text | #E8F0FB | 16.31:1 / 14.41:1 |
| muted | #A2B3CB | 8.78:1 / 7.76:1 |
| surface | #121F33 | Decorative or canvas |
| border | #2B3F5D | Decorative or canvas |
| primary | #8FD8FF | 11.98:1 / 10.58:1 |
| success | #86EFAC | 13.33:1 / 11.78:1 |
| warning | #FCD34D | 12.98:1 / 11.47:1 |
| danger | #FCA5A5 | 9.86:1 / 8.72:1 |

Text/status tokens meet the 4.5:1 normal-text threshold on both preset canvases. Status labels communicate meaning alongside color. Custom themes require fresh contrast checks.

## Content and code

Order: hero → interactive → projects → skills → experience → about → contact.

[portfolio.json](portfolio.json) contains the full editable profile, projects, metrics, tags, and interactive demo data. All people, organizations, and results are fictional examples. Demo widgets are local simulations, and displayed code/SQL is never executed.

The production TSX is in [client/src/components/role-templates](../../../client/src/components/role-templates). Choosing this preset creates an independent draft. Use Preview to enable its widget controls; the advanced demo-data editor validates JSON before applying it. Both export formats use the same React components. React exports include typed source, Tailwind configuration, locked dependencies, and the existing GitHub Actions workflow.
