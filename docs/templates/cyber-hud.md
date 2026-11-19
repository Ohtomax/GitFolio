# The Cyber HUD

Category: `developer` · Audience: Systems, infrastructure, DevOps, and security engineers · Output: static HTML/CSS/JS

A sci-fi command-centre portfolio for engineers who build systems at scale — pitch-black with electric-cyan HUD accents.

A compact command-line session, dated experience log, repository grid, tools inventory, and a local command-based contact form. Prompts and window chrome carry the identity.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#38bdf8` |
| background | `#050505` |
| text | `#f0f0f0` |
| muted | `#7a7a83` |
| surface | `#0d0d0d` |
| border | `#163f52` |
| Body family | 'Geist Mono', ui-monospace, monospace |
| Heading family | 'Geist', ui-sans-serif, system-ui, sans-serif |
| Font styles | body: mono; heading: sans |
| Density | compact |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 17.88:1 | 17.05:1 |
| muted | 4.79:1 | 4.57:1 |
| accent | 9.51:1 | 9.07:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → Projects → Experience → Skills → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — Thoughtful systems. Precise interfaces.

Eyebrow: SYS // PROFILE_01 ◈  —  Kai Nakamura / Full-Stack Engineer

Subtitle: > STATUS: AVAILABLE FOR WORK  ●

I architect full-stack products from database schema to pixel-perfect UI. Comfortable owning a feature end-to-end, debugging a midnight incident, or pairing with design to get the interaction right.

Tags: TypeScript · React · Node.js · PostgreSQL

- **15+** — Products shipped end-to-end
- **99.9%** — Example service uptime SLO
- **7 yrs** — Building for the web

CTA: [Get in touch ↗](mailto:kai@example.com)

### 2. Projects — 01 // SELECTED WORK

Featured applications — click to explore.

- **Prism — real-time analytics dashboard** — PROJECT_01 · 2026
  Replaced a slow reporting pipeline with a live event stream. Users went from waiting 30 s for a page load to seeing data update as it happened.
  Stack: React · WebSockets · ClickHouse
  Link: https://example.com/prism
  Decorative cover: dashboard
- **Lumen — developer onboarding platform** — PROJECT_02 · 2025
  Cut new-engineer setup time from two days to under three hours with a guided, automated environment bootstrapper.
  Stack: Node.js · Docker · TypeScript
  Link: https://example.com/lumen
  Decorative cover: code
- **Shard — distributed job scheduler** — PROJECT_03 · 2024
  A horizontally scalable task queue with per-job retry budgets, dead-letter inspection, and an observable web UI.
  Stack: Go · Redis · PostgreSQL
  Link: https://example.com/shard
  Decorative cover: code

### 3. Experience — 02 // JOURNEY & CREDENTIALS

- **Senior Full-Stack Engineer · Vantage Systems** — 2023 — Present
  Own the core product API and its React frontend. Led a zero-downtime database migration affecting 200 k daily active users.
- **Software Engineer · Fieldstone Labs** — 2020 — 2023
  Built and maintained three customer-facing features from spec to production, including an async notification system and a live-search API.

### 4. Skills — 03 // TOOLCHAIN

The stack I reach for — and the fundamentals beneath it.

Tags: TypeScript · React · Next.js · Node.js · PostgreSQL · Redis · Docker · AWS

- **[frontend]**
  React · Next.js · Tailwind CSS · Framer Motion · Accessibility
- **[backend]**
  Node.js · Express · Prisma · PostgreSQL · Redis · REST · GraphQL
- **[platform]**
  Docker · GitHub Actions · AWS (EC2, S3, RDS) · Vercel

### 5. Contact — 04 // CONNECT

Subtitle: Have an idea? Let's build something real.

I'm interested in ambitious products where engineering craft and user experience meet. Send a message — I reply to every thoughtful email.

CTA: [kai@example.com ↗](mailto:kai@example.com)
