# GitFolio — 5 New Modern Templates · Implementation Plan

> **Strategy**: One template per git commit + push. Each push is self-contained and passes build + type-check before it lands on `main`.

```
Commit 1 → feat(templates): add Cyber HUD template
Commit 2 → feat(templates): add Neon Editorial template
Commit 3 → feat(templates): add Glassmorphic Bento template
Commit 4 → feat(templates): add Dark Executive template
Commit 5 → feat(templates): add Terminal Noir template
```

---

## Pre-flight Checklist

Before starting, verify the workspace is clean and the shared package builds:

```bash
cd GitFolio
git status                      # should be clean on main
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs   # docs regenerate without errors
```

> [!IMPORTANT]
> The existing `BUILTIN_TEMPLATES` array lives in `packages/shared/src/portfolio/index.ts`.
> New templates piggyback on the **same five existing layout renderers** (`terminal`, `editorial`, `bento`, `executive`, `minimal`) — no new renderer function is needed.
> New UUIDs start at `10000000-0000-4000-8000-000000000006` and increment.

---

## Files Touched Per Template

| File | Action |
|---|---|
| `packages/shared/src/portfolio/<slug>.ts` | **Create** — template object + exported const |
| `packages/shared/src/portfolio/index.ts` | **Edit** — add import + push to `BUILTIN_TEMPLATES` |
| `docs/templates/<layout>.md` | **Auto-regenerated** by `template-specs.mjs` |
| `docs/portfolio-templates.json` | **Auto-regenerated** by `template-specs.mjs` |

---

## Commit 1 — Cyber HUD

### 1a. Create `packages/shared/src/portfolio/cyber-hud.ts`

```ts
import { TemplateSchema } from '../validation/template.schema.js';

export const cyberHudTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000006',
  name: 'The Cyber HUD',
  category: 'developer',
  isReact: false,
  thumbnailUrl: null,
  description: 'A sci-fi command-centre portfolio for engineers who build systems at scale — pitch-black with electric-cyan HUD accents.',
  defaultConfig: {
    theme: {
      layout: 'terminal',
      demo: true,
      colors: {
        background: '#050505',
        surface:    '#0d0d0d',
        text:       '#f0f0f0',
        muted:      '#71717a',
        accent:     '#38bdf8',
        border:     '#163f52',
      },
      font: 'mono',
      headingFont: 'sans',
      spacing: 'compact',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: 'SYS // PROFILE_01 ◈  —  Kai Nakamura / Full-Stack Engineer',
          heading: 'Thoughtful systems. Precise interfaces.',
          subtitle: '> STATUS: AVAILABLE FOR WORK  ●',
          description: 'I architect full-stack products from database schema to pixel-perfect UI. Comfortable owning a feature end-to-end, debugging a midnight incident, or pairing with design to get the interaction right.',
          buttonLabel: 'Get in touch ↗',
          buttonUrl: 'mailto:kai@example.com',
          tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
          metrics: [
            { value: '15+', label: 'Products shipped end-to-end' },
            { value: '99.9%', label: 'Example service uptime SLO' },
            { value: '7 yrs',  label: 'Building for the web' },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: '01 // SELECTED WORK',
          description: 'Featured applications — click to explore.',
          items: [
            {
              title: 'Prism — real-time analytics dashboard',
              subtitle: 'PROJECT_01 · 2026',
              description: 'Replaced a slow reporting pipeline with a live event stream. Users went from waiting 30 s for a page load to seeing data update as it happened.',
              url: 'https://example.com/prism',
              visual: 'dashboard',
              tags: ['React', 'WebSockets', 'ClickHouse'],
            },
            {
              title: 'Lumen — developer onboarding platform',
              subtitle: 'PROJECT_02 · 2025',
              description: 'Cut new-engineer setup time from two days to under three hours with a guided, automated environment bootstrapper.',
              url: 'https://example.com/lumen',
              visual: 'code',
              tags: ['Node.js', 'Docker', 'TypeScript'],
            },
            {
              title: 'Shard — distributed job scheduler',
              subtitle: 'PROJECT_03 · 2024',
              description: 'A horizontally scalable task queue with per-job retry budgets, dead-letter inspection, and an observable web UI.',
              url: 'https://example.com/shard',
              visual: 'terminal',
              tags: ['Go', 'Redis', 'PostgreSQL'],
            },
          ],
        },
      },
      {
        type: 'experience', visible: true,
        content: {
          heading: '02 // JOURNEY & CREDENTIALS',
          description: '',
          items: [
            {
              title: 'Senior Full-Stack Engineer · Vantage Systems',
              subtitle: '2023 — Present',
              description: 'Own the core product API and its React frontend. Led a zero-downtime database migration affecting 200 k daily active users.',
            },
            {
              title: 'Software Engineer · Fieldstone Labs',
              subtitle: '2020 — 2023',
              description: 'Built and maintained three customer-facing features from spec to production, including an async notification system and a live-search API.',
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: '03 // TOOLCHAIN',
          description: 'The stack I reach for — and the fundamentals beneath it.',
          tags: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
          items: [
            { title: '[frontend]', description: 'React · Next.js · Tailwind CSS · Framer Motion · Accessibility' },
            { title: '[backend]',  description: 'Node.js · Express · Prisma · PostgreSQL · Redis · REST · GraphQL' },
            { title: '[platform]', description: 'Docker · GitHub Actions · AWS (EC2, S3, RDS) · Vercel' },
          ],
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: '04 // CONNECT',
          subtitle: 'Have an idea? Let\'s build something real.',
          description: 'I\'m interested in ambitious products where engineering craft and user experience meet. Send a message — I reply to every thoughtful email.',
          buttonLabel: 'kai@example.com ↗',
          buttonUrl: 'mailto:kai@example.com',
        },
      },
    ],
  },
});
```

### 1b. Edit `packages/shared/src/portfolio/index.ts`

Add after the last role import line:

```ts
import { cyberHudTemplate } from './cyber-hud.js';
```

Update the array:

```ts
export const BUILTIN_TEMPLATES: Template[] = [
  minimalTemplate, terminalTemplate, editorialTemplate, bentoTemplate, executiveTemplate,
  backendTemplate, securityTemplate, qualityTemplate, frontendTemplate, fullstackTemplate,
  cyberHudTemplate, // ← NEW
];
```

### 1c. Build + validate

```bash
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs
```

### 1d. Commit & push

```bash
git add packages/shared/src/portfolio/cyber-hud.ts \
        packages/shared/src/portfolio/index.ts \
        packages/shared/dist/ \
        docs/templates/ docs/portfolio-templates.json
git commit -m "feat(templates): add Cyber HUD template

Sci-fi command-centre aesthetic — pitch-black (#050505) base, electric
cyan (#38bdf8) HUD accents, monospace metadata with 01 // section
indexing. Uses the terminal renderer. Targets full-stack engineers.

UUID: 10000000-0000-4000-8000-000000000006"
git push origin main
```

---

## Commit 2 — Neon Editorial

### 2a. Create `packages/shared/src/portfolio/neon-editorial.ts`

```ts
import { TemplateSchema } from '../validation/template.schema.js';

export const neonEditorialTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000007',
  name: 'Neon Editorial',
  category: 'professional',
  isReact: false,
  thumbnailUrl: null,
  description: 'A luxury developer-magazine aesthetic — deep navy, lavender-purple accents, and editorial serif headings for engineers who also write.',
  defaultConfig: {
    theme: {
      layout: 'editorial',
      demo: true,
      colors: {
        background: '#07080f',
        surface:    '#0f1120',
        text:       '#e8eaf6',
        muted:      '#7986cb',
        accent:     '#818cf8',
        border:     '#1e2240',
      },
      font: 'sans',
      headingFont: 'serif',
      spacing: 'spacious',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: 'Vol. 01 — Engineering',
          heading: 'Code that reads like good prose.',
          subtitle: 'Full-Stack Engineer & Technical Writer · Berlin, DE',
          description: 'I build robust web applications and document the thinking behind them. My work lives at the intersection of clear architecture and writing people actually want to read.',
          buttonLabel: 'Read my work ↗',
          buttonUrl: 'mailto:mira@example.com',
          tags: ['React', 'TypeScript', 'Technical Writing'],
          metrics: [
            { value: '40+',  label: 'Articles published' },
            { value: '10k',  label: 'Monthly readers' },
            { value: '8 yrs', label: 'Engineering experience' },
          ],
        },
      },
      {
        type: 'about', visible: true,
        content: {
          heading: 'Bridging code and clarity.',
          description: 'I\'m Mira — an engineer who can\'t stop writing. After eight years building products at startups and agencies, I found that the best technical decisions come from understanding the problem in plain language first.\n\nI write to understand. I build to verify. The two habits make each other sharper.',
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'Vol. 02 — Featured Work',
          description: 'Selected case studies at the intersection of engineering rigour and design sensibility.',
          items: [
            {
              title: 'Compass — a documentation platform that doesn\'t punish writers',
              subtitle: 'Full-stack case study · 2026',
              description: 'Redesigned a fragmented internal wiki into a structured, searchable knowledge base. Adoption jumped from 40 % to 91 % of the engineering org within one quarter.',
              url: 'https://example.com/compass',
              visual: 'code',
              tags: ['Next.js', 'PostgreSQL', 'Full-text search'],
            },
            {
              title: 'Fieldwork — async collaboration for distributed teams',
              subtitle: 'Product engineering · 2025',
              description: 'Built the notification and threading system that reduced meeting load by 30 % for a 60-person remote product team.',
              url: 'https://example.com/fieldwork',
              visual: 'dashboard',
              tags: ['React', 'Node.js', 'WebSockets'],
            },
          ],
        },
      },
      {
        type: 'writing', visible: true,
        content: {
          heading: 'Vol. 03 — Writing',
          description: 'Long-form pieces on software engineering, product thinking, and the craft of building things people use.',
          items: [
            { title: 'On the value of boring infrastructure', subtitle: 'Engineering · Jan 2026', url: 'https://example.com/boring-infrastructure' },
            { title: 'What documentation is actually for', subtitle: 'Process · Oct 2025',      url: 'https://example.com/documentation' },
            { title: 'The API review that saved three months', subtitle: 'Case study · Jul 2025', url: 'https://example.com/api-review' },
          ],
        },
      },
      {
        type: 'experience', visible: true,
        content: {
          heading: 'Vol. 04 — Background',
          description: '',
          items: [
            { title: 'Staff Engineer · Clearpath Digital',  subtitle: '2022 — Present', description: 'Technical lead for the developer-experience platform. Set coding standards, led architecture reviews, and published the internal engineering blog.' },
            { title: 'Full-Stack Engineer · Meridian Studio', subtitle: '2018 — 2022', description: 'Shipped five client products from idea to launch, introduced component testing, and established the team\'s code review process.' },
          ],
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: 'Let\'s make something worth writing about.',
          subtitle: 'Open to senior engineering and writing roles.',
          description: 'Whether it\'s a product idea, a collaboration, or a talk proposal — I read every message and reply to the interesting ones.',
          buttonLabel: 'mira@example.com ↗',
          buttonUrl: 'mailto:mira@example.com',
        },
      },
    ],
  },
});
```

### 2b. Edit `index.ts`

```ts
import { neonEditorialTemplate } from './neon-editorial.js';

export const BUILTIN_TEMPLATES: Template[] = [
  ..., cyberHudTemplate, neonEditorialTemplate, // ← NEW
];
```

### 2c. Build + validate + push

```bash
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs
git add packages/shared/src/portfolio/neon-editorial.ts \
        packages/shared/src/portfolio/index.ts \
        packages/shared/dist/ \
        docs/templates/ docs/portfolio-templates.json
git commit -m "feat(templates): add Neon Editorial template

Luxury developer-magazine aesthetic — deep navy (#07080f) base, lavender
(#818cf8) accent, editorial serif headings. Uses the editorial renderer.
Targets engineers who write. Includes a Writing section.

UUID: 10000000-0000-4000-8000-000000000007"
git push origin main
```

---

## Commit 3 — Glassmorphic Bento

### 3a. Create `packages/shared/src/portfolio/glassmorphic-bento.ts`

```ts
import { TemplateSchema } from '../validation/template.schema.js';

export const glassmorphicBentoTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000008',
  name: 'Glassmorphic Bento',
  category: 'creative',
  isReact: false,
  thumbnailUrl: null,
  description: 'Dark glass tiles on a deep mesh-gradient canvas — the modular identity grid of a creative technologist.',
  defaultConfig: {
    theme: {
      layout: 'bento',
      demo: true,
      colors: {
        background: '#0a0a12',
        surface:    '#141420',
        text:       '#f4f4f8',
        muted:      '#8b8ba0',
        accent:     '#34d399',
        border:     '#1f1f30',
      },
      font: 'sans',
      headingFont: 'sans',
      spacing: 'comfortable',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: 'Soren Villanueva / Creative Technologist  ●  OPEN TO WORK',
          heading: 'Design that ships. Code that feels.',
          subtitle: 'Design Engineering · Amsterdam, NL',
          description: 'I sit at the intersection of Figma and the browser. I prototype fast, build precise, and care about the last 10 % that makes an interface feel alive.',
          buttonLabel: 'Let\'s create something ↗',
          buttonUrl: 'mailto:soren@example.com',
          tags: ['React', 'Motion', 'Figma', 'TypeScript'],
          metrics: [
            { value: '32',   label: 'Shipped experiments' },
            { value: '6',    label: 'Design systems maintained' },
            { value: '100%', label: 'Side projects finished (eventually)' },
          ],
        },
      },
      {
        type: 'now', visible: true,
        content: {
          heading: 'What\'s on right now.',
          description: 'Small signals from the studio.',
          items: [
            {
              title: 'Currently building',
              subtitle: 'A spatial UI experiment for the browser',
              description: 'Exploring 3D transforms and scroll-driven animations in pure CSS — no library, no excuses.',
            },
            {
              title: 'On repeat',
              subtitle: 'A slow ambient playlist',
              description: 'Something between Brian Eno and a coffee shop at 7 a.m. Perfect for deep-focus sessions.',
            },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'Made with intent and curiosity.',
          description: 'A mix of shipped interfaces, tools, and useful little experiments.',
          items: [
            {
              title: 'Halo — an accessible icon system',
              subtitle: 'Design engineering · 2026',
              description: 'Open-source icon library with consistent optical weight, full ARIA support, and tree-shakeable React components.',
              url: 'https://example.com/halo',
              visual: 'typography',
              tags: ['SVG', 'React', 'Accessibility'],
            },
            {
              title: 'Groundwork — a design token pipeline',
              subtitle: 'Creative tool · 2025',
              description: 'A CLI that syncs Figma variables to W3C design tokens and generates typed TypeScript constants automatically.',
              url: 'https://example.com/groundwork',
              visual: 'code',
              tags: ['Node.js', 'Figma API', 'TypeScript'],
            },
            {
              title: 'Float — a micro-interaction playground',
              subtitle: 'Experiment · 2024',
              description: 'A collection of 24 reusable Framer Motion recipes with copy-paste code snippets and reduced-motion variants.',
              url: 'https://example.com/float',
              visual: 'mobile',
              tags: ['Framer Motion', 'React', 'CSS'],
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: 'My everyday kit.',
          description: 'Enough range to take an idea from sketch to browser.',
          tags: ['Figma', 'React', 'TypeScript', 'CSS', 'Framer Motion', 'Storybook', 'SVG', 'Accessibility'],
          items: [
            { title: 'Always in the loop', description: 'Prototyping · Design systems · Motion design · Visual storytelling · Component architecture' },
          ],
        },
      },
      {
        type: 'about', visible: true,
        content: {
          heading: 'Equal parts sketchbook and source code.',
          description: 'I feel most at home between a design file and a working prototype. My process is hands-on: make something small, put it in front of a real person, notice the friction, make it better.\n\nOutside the studio: film photography, secondhand bookshops, and an ever-growing backlog of side projects I fully intend to finish.',
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: 'Good things start with a hello.',
          description: 'Have an idea that could use a little design and a lot of care? My inbox is open.',
          buttonLabel: 'Say hello ↗',
          buttonUrl: 'mailto:soren@example.com',
          items: [
            { title: 'Email ↗',           url: 'mailto:soren@example.com' },
            { title: 'GitHub ↗',          url: 'https://example.com/soren/code' },
            { title: 'Design notes ↗',    url: 'https://example.com/soren/notes' },
          ],
        },
      },
    ],
  },
});
```

### 3b. Edit `index.ts`

```ts
import { glassmorphicBentoTemplate } from './glassmorphic-bento.js';

export const BUILTIN_TEMPLATES: Template[] = [
  ..., neonEditorialTemplate, glassmorphicBentoTemplate, // ← NEW
];
```

### 3c. Build + validate + push

```bash
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs
git add packages/shared/src/portfolio/glassmorphic-bento.ts \
        packages/shared/src/portfolio/index.ts \
        packages/shared/dist/ \
        docs/templates/ docs/portfolio-templates.json
git commit -m "feat(templates): add Glassmorphic Bento template

Dark glass tiles on a mesh-gradient canvas — near-black (#0a0a12),
mint-green (#34d399) accent, comfortable bento grid. Targets creative
technologists. Includes a Now section with studio widgets.

UUID: 10000000-0000-4000-8000-000000000008"
git push origin main
```

---

## Commit 4 — Dark Executive

### 4a. Create `packages/shared/src/portfolio/dark-executive.ts`

```ts
import { TemplateSchema } from '../validation/template.schema.js';

export const darkExecutiveTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000009',
  name: 'Dark Executive',
  category: 'professional',
  isReact: false,
  thumbnailUrl: null,
  description: 'Enterprise power meets midnight UI — amber-gold accents on near-black for technical leaders who ship at scale.',
  defaultConfig: {
    theme: {
      layout: 'executive',
      demo: true,
      colors: {
        background: '#060608',
        surface:    '#0e0e14',
        text:       '#f5f5f0',
        muted:      '#9ca3af',
        accent:     '#f59e0b',
        border:     '#1c1c24',
      },
      font: 'sans',
      headingFont: 'sans',
      spacing: 'comfortable',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: 'VP Engineering / Fractional CTO',
          heading: 'Scale the team. Ship the product. Repeat.',
          subtitle: 'Technical Leadership · San Francisco, CA',
          description: 'I partner with founders and product leaders to build engineering organisations that ship reliably and grow without breaking. 12 years turning early-stage chaos into durable, scalable systems.',
          buttonLabel: 'Schedule a conversation ↗',
          buttonUrl: 'mailto:dana@example.com',
          tags: ['Technical Leadership', 'Platform Engineering', 'Team Scaling'],
          metrics: [
            { value: '\$42M',  label: 'ARR delivered across engagements' },
            { value: '3',      label: 'Engineering teams built from seed' },
            { value: '12 yrs', label: 'Leading technical organisations' },
          ],
        },
      },
      {
        type: 'experience', visible: true,
        content: {
          heading: 'Track Record',
          description: 'Each role measured by what shipped and what lasted.',
          items: [
            {
              title: 'VP Engineering · Northgate AI',
              subtitle: '2023 — Present',
              description: 'Grew the engineering team from 6 to 28. Established incident response, quarterly planning, and a platform roadmap that cut deployment time by 60 %.',
            },
            {
              title: 'Head of Engineering · Redwood Commerce',
              subtitle: '2019 — 2023',
              description: 'Led technical due diligence for a Series B raise. Rebuilt the monolith into three independently deployable services without a single customer-visible outage.',
            },
            {
              title: 'Senior Staff Engineer · Fulcrum Labs',
              subtitle: '2015 — 2019',
              description: 'Architected a multi-tenant data pipeline processing 2 B events per day. Mentored 11 engineers across four cross-functional squads.',
            },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'Selected Initiatives',
          description: '',
          items: [
            {
              title: 'Platform Engineering Programme',
              subtitle: 'Organisational · 2024',
              description: 'Defined and executed a 12-month roadmap to standardise CI/CD, observability, and on-call practices across a 25-engineer org.',
              url: 'https://example.com/platform-programme',
              visual: 'dashboard',
              tags: ['Platform', 'GitHub Actions', 'OpenTelemetry'],
            },
            {
              title: 'Technical Due Diligence Framework',
              subtitle: 'Advisory · 2023',
              description: 'Open-source checklist and scoring rubric used to evaluate three acquisition targets. Adopted by two VC firms for portfolio assessments.',
              url: 'https://example.com/diligence-framework',
              visual: 'code',
              tags: ['Architecture', 'Security', 'Reliability'],
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: 'Capabilities',
          description: 'A semantic architecture of what I bring to an engagement.',
          tags: ['Technical Strategy', 'API Design', 'Team Scaling', 'Incident Response', 'Platform Engineering', 'Hiring & Mentoring'],
          items: [
            { title: 'Platform Engineering',   description: 'CI/CD · Observability · On-call · Developer experience · Service ownership' },
            { title: 'Technical Leadership',   description: 'Hiring · Career ladders · Engineering culture · Cross-functional alignment' },
            { title: 'Architecture Advisory',  description: 'System design · Migration planning · Technical due diligence · Security posture' },
          ],
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: 'Let\'s talk about what you\'re building.',
          subtitle: 'Available for fractional CTO and advisory engagements.',
          description: 'Whether you\'re navigating a scale problem, a Series A, or a team that keeps shipping slowly — I\'ve been in that room. Tell me what\'s stuck.',
          buttonLabel: 'dana@example.com ↗',
          buttonUrl: 'mailto:dana@example.com',
        },
      },
    ],
  },
});
```

### 4b. Edit `index.ts`

```ts
import { darkExecutiveTemplate } from './dark-executive.js';

export const BUILTIN_TEMPLATES: Template[] = [
  ..., glassmorphicBentoTemplate, darkExecutiveTemplate, // ← NEW
];
```

### 4c. Build + validate + push

```bash
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs
git add packages/shared/src/portfolio/dark-executive.ts \
        packages/shared/src/portfolio/index.ts \
        packages/shared/dist/ \
        docs/templates/ docs/portfolio-templates.json
git commit -m "feat(templates): add Dark Executive template

Midnight enterprise aesthetic — near-black (#060608), amber-gold (#f59e0b)
accent, Source Sans 3 body. Uses executive renderer. Targets VPs of
Engineering and fractional CTOs. Hero leads with impact metrics.

UUID: 10000000-0000-4000-8000-000000000009"
git push origin main
```

---

## Commit 5 — Terminal Noir

### 5a. Create `packages/shared/src/portfolio/terminal-noir.ts`

```ts
import { TemplateSchema } from '../validation/template.schema.js';

export const terminalNoirTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-00000000000a',
  name: 'Terminal Noir',
  category: 'developer',
  isReact: false,
  thumbnailUrl: null,
  description: 'UNIX meets late-night hacker den — pure black, acid green, monospace everything. Structured like data, reads like a story.',
  defaultConfig: {
    theme: {
      layout: 'terminal',
      demo: true,
      colors: {
        background: '#000000',
        surface:    '#0d1117',
        text:       '#c9d1d9',
        muted:      '#484f58',
        accent:     '#39d353',
        border:     '#30363d',
      },
      font: 'mono',
      headingFont: 'mono',
      spacing: 'compact',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: '~/portfolio $ whoami',
          heading: 'alex_chen — security engineer',
          subtitle: '> Specialisation: application security, threat modelling, secure SDLC',
          description: '> Based in Singapore. 9 years breaking things so production doesn\'t have to.\n> Currently: staff security engineer at Irongate Systems.\n> Side project: building open-source static analysis tooling.',
          buttonLabel: './contact ↗',
          buttonUrl: 'mailto:alex@example.com',
          tags: ['Rust', 'Python', 'Go', 'OWASP'],
          metrics: [
            { value: '200+', label: 'CVEs triaged and remediated' },
            { value: '14',   label: 'Penetration tests conducted' },
            { value: '9 yrs', label: 'Application security experience' },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'ls ~/repositories',
          description: '# open-source security tooling',
          items: [
            {
              title: 'taint — dataflow analysis for Node.js apps',
              subtitle: 'a9f3d12 · 2026-04',
              description: 'Static analysis tool that traces user-controlled data through Express middleware to identify injection sinks before code review.',
              url: 'https://example.com/taint',
              visual: 'terminal',
              tags: ['Rust', 'AST analysis', 'Node.js'],
            },
            {
              title: 'boundary — a secrets rotation daemon',
              subtitle: 'c7e1b8a · 2025-11',
              description: 'Automatically rotates API keys and database credentials on a configurable schedule with zero-downtime hot-reload support.',
              url: 'https://example.com/boundary',
              visual: 'code',
              tags: ['Go', 'Vault', 'Kubernetes'],
            },
            {
              title: 'redline — supply chain audit CLI',
              subtitle: 'f2d4096 · 2025-06',
              description: 'Scans npm and PyPI dependency trees for known-vulnerable transitive dependencies and generates a prioritised remediation report.',
              url: 'https://example.com/redline',
              visual: 'terminal',
              tags: ['Python', 'SBOM', 'CVE'],
            },
          ],
        },
      },
      {
        type: 'experience', visible: true,
        content: {
          heading: 'git log --experience --oneline',
          description: '',
          items: [
            {
              title: 'Staff Security Engineer · Irongate Systems',
              subtitle: '2022 → HEAD',
              description: 'Own application security across a 40-service microservices platform. Run quarterly threat model reviews and lead the secure-by-default engineering initiative.',
            },
            {
              title: 'Security Engineer · Cipher Foundry',
              subtitle: '2018 → 2022',
              description: 'Embedded security engineer in product squads. Introduced automated SAST into CI, reducing critical findings at code review by 70 %.',
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: 'cat toolchain.toml',
          description: '',
          tags: ['Rust', 'Python', 'Go', 'Burp Suite', 'OWASP', 'Kubernetes', 'AWS', 'Threat Modelling'],
          items: [
            { title: '[languages]',   description: 'Rust · Python · Go · Bash · SQL' },
            { title: '[appsec]',      description: 'SAST · DAST · Penetration testing · Threat modelling · SBOM · CVE triage' },
            { title: '[platform]',    description: 'Kubernetes · AWS · Vault · GitHub Actions · Docker · Terraform' },
          ],
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: './connect --open',
          subtitle: 'No ceremony required.',
          description: 'Working on a hard security problem, an open-source tool, or a team that takes the SDLC seriously? Send a message. The shell below supports help, email, links, and clear.',
          buttonLabel: 'alex@example.com',
          buttonUrl: 'mailto:alex@example.com',
        },
      },
    ],
  },
});
```

### 5b. Edit `index.ts`

```ts
import { terminalNoirTemplate } from './terminal-noir.js';

export const BUILTIN_TEMPLATES: Template[] = [
  ..., darkExecutiveTemplate, terminalNoirTemplate, // ← NEW
];
```

### 5c. Build + validate + push

```bash
cd packages/shared && npm run build
cd ../.. && node scripts/template-specs.mjs
git add packages/shared/src/portfolio/terminal-noir.ts \
        packages/shared/src/portfolio/index.ts \
        packages/shared/dist/ \
        docs/templates/ docs/portfolio-templates.json
git commit -m "feat(templates): add Terminal Noir template

UNIX hacker-den aesthetic — pure black (#000000), acid green (#39d353)
accent, full monospace stack. Uses terminal renderer. Hero reads like a
shell session; projects use commit-hash subtitles. Targets security
engineers. Contact section uses mountPortfolioInteractions shell.

UUID: 10000000-0000-4000-8000-00000000000a"
git push origin main
```

---

## Final State of `index.ts` (after all 5 commits)

```ts
import { cyberHudTemplate }         from './cyber-hud.js';
import { neonEditorialTemplate }    from './neon-editorial.js';
import { glassmorphicBentoTemplate }from './glassmorphic-bento.js';
import { darkExecutiveTemplate }    from './dark-executive.js';
import { terminalNoirTemplate }     from './terminal-noir.js';

export const BUILTIN_TEMPLATES: Template[] = [
  minimalTemplate, terminalTemplate, editorialTemplate, bentoTemplate, executiveTemplate,
  backendTemplate, securityTemplate, qualityTemplate, frontendTemplate, fullstackTemplate,
  // — 5 new modern templates:
  cyberHudTemplate,
  neonEditorialTemplate,
  glassmorphicBentoTemplate,
  darkExecutiveTemplate,
  terminalNoirTemplate,
];
```

---

## Quick Reference

| # | Template | File | UUID suffix | Layout | Accent | Category |
|---|---|---|---|---|---|---|
| 1 | Cyber HUD | `cyber-hud.ts` | `...0006` | `terminal` | `#38bdf8` cyan | developer |
| 2 | Neon Editorial | `neon-editorial.ts` | `...0007` | `editorial` | `#818cf8` lavender | professional |
| 3 | Glassmorphic Bento | `glassmorphic-bento.ts` | `...0008` | `bento` | `#34d399` mint | creative |
| 4 | Dark Executive | `dark-executive.ts` | `...0009` | `executive` | `#f59e0b` amber | professional |
| 5 | Terminal Noir | `terminal-noir.ts` | `...000a` | `terminal` | `#39d353` acid green | developer |

> [!TIP]
> After all 5 pushes, run `npm run db:seed` on your server to register the new templates in the database so they appear in the **New project** picker.

> [!WARNING]
> Two templates use the `terminal` layout renderer (`cyber-hud` and `terminal-noir`). They share the same HTML structure — their distinction is entirely in the color tokens and copy style. The existing `terminal` renderer already handles both correctly.
