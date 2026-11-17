# Cybersecurity / Threat Intel & Audit

A tactical research portfolio with searchable findings, explicit remediation evidence, and an accessible disclosure drawer.

Category: developer. Density: compact. Fonts: Geist Mono + Geist headings.

A command-center identity rail, filterable audit table, disclosure drawer, research inventory, and a concise trust/contact close.

## Design tokens

| Token | Hex | Contrast on background / surface |
| --- | --- | --- |
| accent | #7DE9B7 | 12.98:1 / 11.59:1 |
| background | #0A1010 | Decorative or canvas |
| text | #E3F4EC | 16.83:1 / 15.02:1 |
| muted | #A0BDB1 | 9.51:1 / 8.49:1 |
| surface | #111E1C | Decorative or canvas |
| border | #2D4941 | Decorative or canvas |
| primary | #E4BE6A | 10.85:1 / 9.68:1 |
| success | #7DE9B7 | 12.98:1 / 11.59:1 |
| warning | #F2CB74 | 12.40:1 / 11.07:1 |
| danger | #FF9C9C | 9.58:1 / 8.55:1 |

Text/status tokens meet the 4.5:1 normal-text threshold on both preset canvases. Status labels communicate meaning alongside color. Custom themes require fresh contrast checks.

## Content and code

Order: hero → interactive → projects → skills → experience → about → contact.

[portfolio.json](portfolio.json) contains the full editable profile, projects, metrics, tags, and interactive demo data. All people, organizations, and results are fictional examples. Demo widgets are local simulations, and displayed code/SQL is never executed.

The production TSX is in [client/src/components/role-templates](../../../client/src/components/role-templates). Choosing this preset creates an independent draft. Use Preview to enable its widget controls; the advanced demo-data editor validates JSON before applying it. Both export formats use the same React components. React exports include typed source, Tailwind configuration, locked dependencies, and the existing GitHub Actions workflow.
