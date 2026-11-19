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
            { value: '$42M',  label: 'ARR delivered across engagements' },
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
