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
