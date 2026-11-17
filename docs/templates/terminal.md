# The Terminal / Cyberpunk

Category: `developer` · Audience: Systems, infrastructure, DevOps, and security engineers · Output: React with GitHub Actions

A compact, phosphor-lit command-line portfolio for engineers who make complex systems dependable.

A compact command-line session, dated experience log, repository grid, tools inventory, and a local command-based contact form. Prompts and window chrome carry the identity.

## Design tokens

| Token | Exact value |
| --- | --- |
| accent | `#86EFAC` |
| background | `#0B0F0C` |
| text | `#E4F1E8` |
| muted | `#A0B4A6` |
| surface | `#101812` |
| border | `#2C4332` |
| Body family | 'Geist Mono', ui-monospace, monospace |
| Heading family | 'Geist Mono', ui-monospace, monospace |
| Font styles | body: mono; heading: mono |
| Density | compact |

Text, muted text, and accent contrast against the background / card surface:

| Foreground | Background | Surface |
| --- | --- | --- |
| text | 16.59:1 | 15.54:1 |
| muted | 8.80:1 | 8.24:1 |
| accent | 13.75:1 | 12.88:1 |

The preset text combinations exceed 4.5:1. Decorative borders are not used to convey essential information. Custom colors need a new contrast check; this palette check alone is not a full WCAG conformance audit.

## Default content and order

Hero → Experience → Projects → Skills → About → Contact

All identities, organizations, metrics, and work below are fictional examples. Links use example.com. The default footer labels them as illustrative; replace them before removing that label in Theme controls.

### 1. Hero — Systems that stay boring. In the best way.

Eyebrow: Jules Park / Infrastructure engineer

Subtitle: Backend · Platform · Reliability

I build the infrastructure behind the interface: observable services, repeatable deployments, and failure modes you can actually explain. Based in Toronto. Comfortable on call.

Tags: Go · Rust · Linux

- **99.95%** — Example service SLO
- **8 min** — Recovery drill target
- **42** — Runbooks maintained

CTA: [open contact →](mailto:jules@example.com)

### 2. Experience — git log --experience

A changelog of problems I’ve helped make smaller.

- **Staff Platform Engineer · Signal Harbor** — 2024 → HEAD
  Standardized service ownership and rollback paths across 18 services. Turned incident reviews into tracked reliability improvements.
  Stack: Kubernetes · OpenTelemetry · Go
- **Backend Engineer · Packet Works** — 2021 → 2024
  Built event ingestion and idempotent processing pipelines. Replaced manual release steps with repeatable, reviewable automation.
  Stack: PostgreSQL · Terraform · Kafka

### 3. Projects — ls ~/repositories

Small tools. Clear contracts. Fewer surprises.

- **watchtower** — Service health without the guesswork
  A lightweight probe runner with useful exit codes, structured logs, and an intentionally small configuration surface.
  Stack: Go · Observability
  Link: https://example.com/watchtower
- **driftctl-lab** — Infrastructure changes, explained
  An experimental plan reviewer that annotates infrastructure diffs with ownership and rollback notes.
  Stack: Rust · Terraform
  Link: https://example.com/driftctl-lab
- **queue-notes** — Distributed systems, tested locally
  Executable notes on retries, idempotency, dead letters, and what happens when the worker disappears.
  Stack: TypeScript · Redis
  Link: https://example.com/queue-notes

### 4. Skills — cat toolchain.toml

Tools I reach for after understanding the constraints.

- **[languages]**
  Go · Rust · Python · TypeScript · SQL
- **[platform]**
  Linux · Docker · Kubernetes · Terraform · GitHub Actions
- **[practice]**
  Threat modeling · SLOs · Incident response · Capacity planning

### 5. About — cat README.md

I’m Jules. I like tracing a vague symptom to a concrete cause, writing down what I learn, and leaving a system easier to operate than I found it.

My favorite fix is often a smaller abstraction, a better error message, or a runbook someone can trust at 3 a.m.

### 6. Contact — ./connect

Subtitle: No handshake ceremony required.

Working on a reliability problem, an infrastructure tool, or a team that values operational craft? Send a note. The shell below supports help, email, links, and clear.

CTA: [jules@example.com](mailto:jules@example.com)
