# Monochrome / Online CV

Category: `developer` · Audience: Developers and students building a personal online CV · Output: static HTML/CSS/JS

Inspired by the OnlineCv portfolio: bold black-and-white typography, a glass portrait frame, constellation details, a moving toolkit strip, and spacious project stories.

Inspired by the owner-supplied OnlineCv reference: black-and-white typography, a two-column hero, an editable portrait with initials fallback, a viewport-sized constellation background, a scrolling toolkit strip, glass project cards, biography, skills, career entries, certificates, and a direct-contact close. Motion follows the reference with staggered entrances, shimmering headings, an editable looping typewriter, floating portrait, rotating rings, scan line, breathing glow, mouse-following spotlight and card tilt, repeated scroll reveals, and staggered toolkit chips. The sticky header offers Pause motion. Effects run only in interactive previews and exports, follow live reduced-motion preferences, and stop when their area or the document is hidden. Content and native mobile navigation remain available without JavaScript.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#ffffff` |
| background | `#050505` |
| text | `#fafafa` |
| muted | `#a1a1aa` |
| surface | `#101012` |
| border | `#303034` |
| Body family | 'Geist', ui-sans-serif, system-ui, sans-serif |
| Heading family | 'Manrope', ui-sans-serif, system-ui, sans-serif |
| Font styles | body: sans; heading: sans |
| Density | spacious |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 19.53:1 | 18.21:1 |
| muted | 7.95:1 | 7.42:1 |
| accent | 20.38:1 | 19.01:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → Projects → About → Skills → Experience → Education → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — Thoughtful
digital experiences.

Eyebrow: Jordan Avery / Full-Stack Developer

Subtitle: React & TypeScript interfaces. Node.js APIs. Cloud delivery.

Portrait description: Jordan Avery

Hey, I’m Jordan. A developer who brings ideas to life with considered interfaces, dependable APIs, and the curiosity to keep learning. I enjoy making the complicated feel simple.

Tags: React & TypeScript · Node.js · Express · Prisma · PostgreSQL · Cloud infrastructure · Accessible interfaces

- **Remote** — Based in
- **Full-stack** — Focus
- **Open** — Collaborations

CTA: [Let’s talk](mailto:jordan@example.com)

### 2. Projects — A few things
I’ve built.

Subtitle: Selected work

From the first sketch to the last deployment, I like building things that make an idea tangible.

- **Wayfinder** — WEB APPLICATION
  A shared planning space that turns scattered ideas into clear next steps. I designed the interface and built the API, authentication, and collaborative workspace.
  Stack: React · TypeScript · Node.js · PostgreSQL
  Link: https://example.com/wayfinder
  Decorative cover: dashboard
- **Form & Field** — FRONTEND DEVELOPMENT
  A responsive storefront for an independent studio, with a considered product gallery, accessible navigation, and a lightweight checkout flow.
  Stack: React · CSS · Accessibility · Vite
  Link: https://example.com/form-and-field
  Decorative cover: typography

### 3. About — Curious by nature.
Developer by choice.

Subtitle: The person behind the code

I’m a developer who cares about the people on the other side of the screen. I enjoy understanding how a system fits together, then making each part easier to use and maintain.

My process is practical: ask good questions, build something small, learn from real feedback, and keep improving it. Away from the keyboard, I’m usually exploring a new place or adding another idea to my sketchbook.

### 4. Skills — The toolkit.

Subtitle: What I build with

Tools I reach for, backed by the fundamentals that make them useful.

Tags: React · TypeScript · Node.js · Express · PostgreSQL · Prisma · HTML & CSS · Git · Docker · AWS · Testing · Accessibility

- **From interface to infrastructure**
  Component architecture, API design, relational data, automated checks, and the care needed to ship and maintain a useful product.

### 5. Experience — Learning through
doing.

Subtitle: Education & experience

Every project adds another perspective to how I solve problems and work with people.

- **Full-Stack Developer · Northline Studio** — 2024 — Present
  Build and maintain web applications across the interface, API, and database. Work closely with design and product to turn a clear problem into a dependable feature.
- **BSc Computer Science · Westbridge College** — 2020 — 2024
  Studied software engineering, databases, and human-computer interaction, with a focus on applying the fundamentals in collaborative projects.

### 6. Education — Always a student.

Subtitle: Certifications & continuing learning

A few milestones in an ongoing learning habit.

- **Web Accessibility Foundations** — Example certification · 2025
  Link: https://example.com/certificates/accessibility
- **Cloud Architecture Fundamentals** — Example certification · 2025
  Link: https://example.com/certificates/cloud
- **Secure Software Development** — Example certification · 2024
  Link: https://example.com/certificates/security

### 7. Contact — Let’s make
something good.

Subtitle: Have an idea?

Have a project in mind, an interesting problem, or just a good reason to connect? I’d love to hear from you.

- **Email**
  Link: mailto:jordan@example.com
- **GitHub**
  Link: https://example.com/jordan/code
- **LinkedIn**
  Link: https://example.com/jordan/profile

CTA: [Get in touch](mailto:jordan@example.com)
