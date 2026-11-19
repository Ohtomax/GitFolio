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
        muted:      '#7a7a83',
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
              visual: 'code',
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
