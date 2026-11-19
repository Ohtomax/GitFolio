# Obsidian / Developer Journal

Category: `premium` · Audience: Full-stack developers, independent builders, and technical writers · Output: static HTML/CSS/JS

A dark developer portfolio inspired by kroszborg.co, with a sticky personal profile, floating navigation, expandable experience, visual project cards, and a technical journal.

A Premium developer journal inspired by kroszborg.co: a floating navigation dock, sticky profile with an optional portrait and initials fallback, native expandable experience entries, two-column project and writing cards, biography, tools, personal links, and contact. Interactive previews and both exports add drifting contour and glow layers, staggered profile entrances, a glowing portrait, a blinking role caret, scroll reveals, and mouse-driven artwork depth. Pause motion and live reduced-motion support control the effects; continuous animation pauses off screen and when the tab is hidden. The editing canvas and thumbnails stay still. The profile stacks above the content on mobile. All sample identities and work are original fictional examples; project art and the background use CSS. Navigation and disclosures work without JavaScript.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#c4b5fd` |
| background | `#0b0b0d` |
| text | `#f5f5f7` |
| muted | `#ababba` |
| surface | `#17171b` |
| border | `#303037` |
| Body family | 'Geist', ui-sans-serif, system-ui, sans-serif |
| Heading family | 'Manrope', ui-sans-serif, system-ui, sans-serif |
| Font styles | body: sans; heading: sans |
| Density | comfortable |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 18.06:1 | 16.42:1 |
| muted | 8.68:1 | 7.89:1 |
| accent | 10.65:1 | 9.68:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → Experience → Projects → Writing → About → Skills → Now → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — Alex Morgan

Eyebrow: Building for the web

Subtitle: Full-stack developer

Portrait description: Alex Morgan

I turn interesting problems into useful web applications. I care about thoughtful interfaces, dependable systems, and sharing what I learn along the way.

Tags: React · TypeScript · Node.js · PostgreSQL

CTA: [Get in touch](mailto:alex@example.com)

### 2. Experience — Experience

Where I’ve been building, learning, and contributing.

- **Northstar Studio** — Full-stack developer · 2024 — Present · Remote
  Build a shared workspace for small creative teams, from accessible React interfaces to typed APIs and relational data models.

Recent work includes a reusable component library, a clearer onboarding flow, and background jobs that keep longer tasks out of the request path.
  Stack: React · TypeScript · Node.js · PostgreSQL
  Link: https://example.com/northstar
- **Common Ground** — Frontend developer · 2022 — 2024
  Worked with designers and product teams on a community publishing platform. Built responsive reading and editing experiences, improved keyboard navigation, and introduced focused component tests.
  Stack: React · CSS · Accessibility · Testing
  Link: https://example.com/common-ground
- **Small Hours Lab** — Software development intern · 2021 — 2022
  Prototyped internal tools, wrote documentation, and learned how to turn a small feature into a maintainable part of a larger application.
  Stack: JavaScript · HTML & CSS · Git
  Link: https://example.com/small-hours

### 3. Projects — Projects

A few ideas I’ve taken from a sketch to a working prototype.

- **Folio** — A calmer workspace
  A project hub for independent teams. Notes, tasks, and decisions live together so the next step is always easy to find.
  Stack: React · TypeScript · PostgreSQL
  Link: https://example.com/folio
  Decorative cover: dashboard
- **Relay** — Small services, clear contracts
  A developer toolkit for exploring background tasks, delivery receipts, and recoverable failures through one consistent interface.
  Stack: Node.js · Redis · Docker
  Link: https://example.com/relay
  Decorative cover: architecture
- **Pocket Notes** — An idea, wherever you are
  An offline-friendly notebook with quick capture, searchable tags, and a reading view that gets out of the way.
  Stack: React · IndexedDB · PWA
  Link: https://example.com/pocket-notes
  Decorative cover: mobile
- **Typecraft** — A little room to experiment
  An interactive playground for testing type scales, spacing, and readable color combinations before building a new interface.
  Stack: TypeScript · CSS · Accessibility
  Link: https://example.com/typecraft
  Decorative cover: typography

### 4. Writing — Writing

Notes from the space between an idea and its implementation.

- **Making background work feel immediate** — November 2026 · 6 min read
  Progress, retries, and the small interface decisions that help people trust a task they cannot see.
  Stack: Queues · UX · Node.js
  Link: https://example.com/writing/background-work
  Decorative cover: architecture
- **A component API is a conversation** — October 2026 · 5 min read
  What a few ordinary form controls taught me about defaults, composition, and leaving room for the next use case.
  Stack: React · TypeScript · Design systems
  Link: https://example.com/writing/component-api
  Decorative cover: code

### 5. About — A little about me

Subtitle: Curious about how things work. Even more curious about who they help.

I’m Alex, a developer who enjoys working across the whole product. I like asking questions, building a small version, and learning from the people who use it.

This journal is a place for the projects, experiments, and lessons I want to keep. Away from a screen, I’m usually walking somewhere new, reading, or making another overambitious weekend plan.

### 6. Skills — Tools I reach for

A practical toolkit, with room to keep learning.

Tags: React · TypeScript · Node.js · Express · PostgreSQL · Prisma · Redis · Docker · Git · Testing · Accessibility

- **Interface to infrastructure**
  Accessible components, typed APIs, relational data, background tasks, and a clear path from local development to deployment.

### 7. Now — Beyond the commits

A few things that keep the curiosity going.

- **Learning in public** — An ongoing notebook
  Experiments, useful mistakes, and the ideas I’m still working through.
  Link: https://example.com/journal
- **My everyday setup** — Tools and working habits
  A short list of the things that make a day of building a little better.
  Link: https://example.com/setup

### 8. Contact — Have a good problem in mind?

Subtitle: Let’s make something useful.

I’m always glad to hear about thoughtful projects, interesting technical questions, or a good reason to collaborate.

- **Resume**
  Link: https://example.com/alex/resume
- **GitHub**
  Link: https://example.com/alex/code
- **LinkedIn**
  Link: https://example.com/alex/profile
- **Email**
  Link: mailto:alex@example.com

CTA: [Start a conversation](mailto:alex@example.com)
