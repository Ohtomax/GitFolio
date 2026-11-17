import { TemplateSchema } from '../../validation/template.schema.js';

export const fullstackTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '30000000-0000-4000-8000-000000000005',
  name: 'Full-Stack Developer / SaaS & Product',
  category: 'developer',
  isReact: true,
  thumbnailUrl: null,
  description: 'A 12-column SaaS bento layout with an 8/4 hero, product metrics, a three-layer stack map, and a selectable UI-to-API-to-query trace.',
  defaultConfig: {
    theme: {
      layout: 'fullstack',
      demo: true,
      font: 'sans',
      headingFont: 'sans',
      spacing: 'comfortable',
      colors: {
        background: '#0B0D14',
        surface: '#141824',
        text: '#F4F5F8',
        muted: '#9DA4B7',
        accent: '#A78BFA',
        primary: '#C4B5FD',
        border: '#2A3047',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171'
      }
    },
    sections: [
      {
        type: 'hero',
        visible: true,
        content: {
          eyebrow: 'Maya Lin / Full-stack product engineer',
          heading: 'From database transaction to user delight.',
          subtitle: 'Next.js · TypeScript · Node.js · PostgreSQL · Docker',
          description: 'I design and build resilient SaaS products end-to-end. I care equally about transactional integrity in the database and fluid, accessible interactions in the browser.',
          tags: ['Founding engineer mindset', 'Type-safe end-to-end', 'Shipped 4 production products'],
          metrics: [
            { value: '$24k MRR', label: 'Bootstrapped SaaS products' },
            { value: '45k MAU', label: 'Supported on zero ops' },
            { value: '99.98%', label: 'Production SLA' }
          ],
          buttonLabel: 'Build a product with me ↗',
          buttonUrl: 'mailto:maya@example.com'
        }
      },
      {
        type: 'interactive',
        visible: true,
        content: {
          heading: 'Trace an action through every layer.',
          description: 'Select an end-to-end flow to inspect how a user interaction translates into an authenticated API route, database SQL query, and observable telemetry.',
          widget: {
            kind: 'flow',
            flows: [
              {
                id: 'invite',
                label: 'Invite teammate',
                route: 'POST /api/invitations',
                query: 'INSERT INTO invitations (id, organization_id, email, role, token, expires_at)\nVALUES ($1, $2, $3, $4, $5, $6)\nRETURNING id, email, role, expires_at;',
                result: '{\n  "success": true,\n  "data": {\n    "invitationId": "inv_8829a1",\n    "status": "pending",\n    "email": "teammate@company.com",\n    "expiresIn": "7d"\n  }\n}',
                latency: '18 ms',
                explanation: 'Verifies workspace RBAC permissions, creates cryptographically secure invitation token, writes to database with row-level locks, and dispatches an asynchronous worker job to deliver the branded transactional email.'
              },
              {
                id: 'checkout',
                label: 'Upgrade subscription',
                route: 'POST /api/billing/checkout-session',
                query: 'UPDATE organizations\nSET billing_tier = $1, stripe_customer_id = $2, updated_at = NOW()\nWHERE id = $3\nRETURNING id, name, billing_tier;',
                result: '{\n  "success": true,\n  "data": {\n    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_live_sample",\n    "tier": "enterprise"\n  }\n}',
                latency: '24 ms',
                explanation: 'Validates customer subscription state in Redis cache, updates customer record in PostgreSQL, and generates an authenticated checkout session with webhook signature verification.'
              },
              {
                id: 'activity',
                label: 'Query audit stream',
                route: 'GET /api/workspace/audit-events',
                query: 'SELECT e.id, e.action, e.actor_id, e.ip_address, e.created_at, u.name AS actor_name\nFROM audit_events e\nINNER JOIN users u ON u.id = e.actor_id\nWHERE e.organization_id = $1\nORDER BY e.created_at DESC\nLIMIT 25 OFFSET $2;',
                result: '{\n  "success": true,\n  "data": {\n    "events": [\n      { "id": "evt_101", "action": "member.joined", "actorName": "Alex", "time": "2m ago" }\n    ],\n    "total": 142\n  }\n}',
                latency: '9 ms',
                explanation: 'Indexed composite query leveraging connection pooling and read-replica distribution for zero-lag tenant activity monitoring.'
              }
            ]
          }
        }
      },
      {
        type: 'projects',
        visible: true,
        content: {
          heading: 'Shipped SaaS products and systems.',
          description: 'A selection of products taken from concept and system design to scalable production.',
          items: [
            {
              title: 'HyperDraft / Real-time collaborative workspace',
              subtitle: 'Full-stack founder & architect · 2025–2026',
              description: 'Collaborative document editor with optimistic CRDT updates, WebSocket gateway, server-side PDF generation, and Stripe billing. Grew from 0 to 28,000 active creators.',
              url: 'https://example.com/maya/hyperdraft',
              tags: ['Next.js', 'PostgreSQL', 'Redis', 'WebSockets', 'Tailwind'],
              metrics: [
                { value: '28k MAU', label: 'Active creators' },
                { value: '< 15 ms', label: 'Typing sync latency' }
              ]
            },
            {
              title: 'SignalOps / Distributed alert aggregation platform',
              subtitle: 'Founding engineer · 2024–2025',
              description: 'Engineered an end-to-end observability dashboard consolidating webhook alerts across AWS, GCP, and Datadog. Built background worker queues and real-time incident resolution pipelines.',
              url: 'https://example.com/maya/signalops',
              tags: ['React', 'TypeScript', 'Node.js', 'BullMQ', 'Docker'],
              metrics: [
                { value: '1.2M', label: 'Alerts processed/day' },
                { value: '99.99%', label: 'Uptime' }
              ]
            }
          ]
        }
      },
      {
        type: 'skills',
        visible: true,
        content: {
          heading: 'Full-stack craftsmanship across all layers.',
          description: 'Three disciplined tiers delivering coherent user experiences backed by dependable infrastructure.',
          items: [
            {
              title: 'Frontend & UI Craft',
              subtitle: 'React · TypeScript · Next.js · Tailwind',
              description: 'Component architecture, responsive bento layouts, state machines, accessible forms, and smooth micro-animations.'
            },
            {
              title: 'Backend & Data Systems',
              subtitle: 'Node.js · Express · PostgreSQL · Prisma · Redis',
              description: 'Relational schema design, ACID transactions, migrations, REST/GraphQL APIs, rate-limiting, and queue workers.'
            },
            {
              title: 'Infrastructure & Product Delivery',
              subtitle: 'Docker · AWS · GitHub Actions · CI/CD · Vercel',
              description: 'Containerized microservices, zero-downtime database deploys, automated E2E test suites, and product telemetry.'
            }
          ]
        }
      },
      {
        type: 'experience',
        visible: true,
        content: {
          heading: 'Shipped with high-growth teams.',
          description: '',
          items: [
            {
              title: 'Founding Full-Stack Engineer · Beacon Software',
              subtitle: '2023 — Present',
              description: 'Led full-stack product development from prototype to enterprise launch. Shipped core workflows, multi-tenant billing, and role-based permissions.'
            },
            {
              title: 'Full-Stack Software Engineer · North Labs',
              subtitle: '2021 — 2023',
              description: 'Designed client-facing dashboard features, optimized high-volume PostgreSQL queries, and decreased p95 API response times by 40%.'
            }
          ]
        }
      },
      {
        type: 'about',
        visible: true,
        content: {
          heading: 'Building products people actually want to use.',
          description: 'I’m Maya. As a full-stack engineer, I don’t believe in throwing designs over a wall or writing endpoints in a vacuum. I focus on the entire feedback loop: crafting intuitive user interfaces backed by resilient architectures that survive production scale.'
        }
      },
      {
        type: 'contact',
        visible: true,
        content: {
          heading: 'Ready to launch something exceptional?',
          description: 'Whether you need a founding engineer to take an idea from 0 to 1, or an architect to scale an existing SaaS product, let’s talk.',
          buttonLabel: 'maya@example.com ↗',
          buttonUrl: 'mailto:maya@example.com'
        }
      }
    ]
  }
});
