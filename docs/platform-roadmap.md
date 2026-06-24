# Platform roadmap

> The **conventional** side of the product — the console and SaaS plumbing you'd build for *any* tool of this kind, regardless of what it does. Kept separate from `roadmap.md` (the product wedge) on purpose: mixing "make the spec pipeline better" with "build billing" makes both harder to read.
>
> **Last reconciled against `git log` on 2026-06-23.** Status reflects what's in the repo, not what was planned.
>
> **Numbering.** Forward work here is **P0 → P3**, deliberately distinct from the product roadmap's **Phase 1 → 5** so the two can't be confused. Both can run in parallel.

## Filing rule (read before adding anything)

- **Product roadmap (`roadmap.md`)** — anything that makes the *idea → spec → plan → PR* translation better. The wedge: transcripts, code grounding, codegen quality, outcome tracking, the pipeline UX.
- **Platform roadmap (this doc)** — anything you'd build for *any* B2B SaaS console regardless of what it does: orgs, roles, billing, audit, account security, search, settings.
- **Seams (serve both)** — flagged below with a single owning roadmap so they aren't duplicated:
  - **Integrations** (Linear/Jira = "tickets out" product value *and* a connector surface) → owned **here**; the product roadmap references it.
  - **Collaboration / comments** (product multiplayer *and* a platform sharing primitive) → owned **here**.
  - **Usage analytics** (console furniture *and* the input to Loop's pricing) → owned **here**; pricing strategy stays in `pricing.md`.

When in doubt: if removing the feature would still leave Loop a worse *generic* SaaS, it's platform; if it would leave the *translation* worse, it's product.

---

## Current state — shipped

- **Identity & access** ✓ (partial) — Neon Auth (Better Auth): email sign-in, `Project.userId` scoping, orphan-claim. No organizations/teams yet.
- **Console UX** ✓ — two-tier shell: org-scoped nav (Projects · People · Billing · Integrations · Settings) and project-scoped nav (Overview · Settings), org + project switchers in the header, account menu (name/email · theme · sign out). Adaptive off the route.
- **Surfaces stubbed** — People, Billing (Free/Pro cards), Integrations (connector grid), org + project Settings, and a usage-cards row on Projects all exist as intentional placeholders. The nav/UX is locked; the backends are not built.

**Platform briefs that already exist** (homeless until now — this doc owns them):
- `pricing.md` — pricing strategy (charge in feedback now; usage-based later given real COGS).
- `docs/specs/usage-instrumentation.md` — the Postgres cost ledger (tokens + $ per call, joinable to org/project/feature). The input to both Usage analytics and Billing.

---

## The keystone

Almost everything below is gated on one thing: **Organizations**. Adopt the Better Auth `organization` plugin (already shipped in the dependency) for orgs / members / invitations / roles, add `Project.organizationId`, and move access checks from "user owns project" to "user is a member of the project's org." This extends the existing auth work; the migration assigns each existing project to its owner's personal org.

Build P0 first. After it, the placeholders start becoming real.

---

## Capability pillars (the stable structure)

Each pillar has a maturity ladder (none → minimal → complete). Pillars are stable; the rungs are the work.

- **Identity & access** — auth ✓ → organizations → membership → roles/RBAC → SSO
- **Account** — profile → security (2FA / sessions) → notification prefs → personal API tokens
- **Billing & plans** — Stripe customer → plans → usage metering → invoices/payment → dunning/enterprise terms
- **Usage & observability** — cost ledger → usage dashboards → audit log → status/health
- **Integrations platform** — connector framework → GitHub App → Linear/Jira/Slack → webhooks/public API
- **Settings & config** — org settings → default models/policies → danger zone
- **Console UX** — shell ✓ → global search (⌘K) → notifications inbox → onboarding → help/changelog

---

## Phases

### P0 · Foundation (the keystone)
The unlock. Mostly auth + a migration; little net-new UI.
- **Identity & access** — Better Auth org plugin; `Project.organizationId` + migration; personal org auto-created on signup; access via membership; org switcher becomes real.
- **Account** — wire the Better Auth account surfaces: profile, security (password/2FA/sessions). Mostly configuration.
- **Settings** — make org name/slug actually editable (real org record behind the stub).

### P1 · Team-ready
Turn the single-player tool into a team tool.
- **Identity & access** — roles (owner/admin/member) enforced in server actions.
- **People** — invite teammates, accept-invitation flow, member list, role changes.
- **Usage & observability** — basic **audit log** (who invited/approved/deleted).
- **Console UX** — global **search / ⌘K** (jump to project/feature/spec); **notifications inbox** scaffold.

### P2 · Monetization
Charge, once there's something to meter.
- **Usage & observability** — ship the **cost ledger** (`usage-instrumentation.md`) → real numbers in the Projects usage cards + a usage dashboard.
- **Billing & plans** — Stripe customer per org; plans; usage-based metering off the ledger; invoices/payment; the **Upgrade** button goes live. Strategy: `pricing.md`.

### P3 · Enterprise
Every org has its own stack and compliance bar.
- **Identity & access** — SSO/SAML; custom roles.
- **Usage & observability** — advanced audit (export, retention), status page.
- **Integrations platform** — connector framework + GitHub App (replacing the per-project PAT), Linear/Jira/Slack, outbound **webhooks** + a public **API** with org keys.

(Integrations sits in P3 as a *platform* concern, but individual connectors can be pulled forward when the product roadmap wants them — e.g. "tickets out" to Linear. Flag the overlap when you do.)

---

## How this relates to the product roadmap

- `roadmap.md` owns the wedge (Phases 1–5). This doc owns the console (P0–P3). They interleave; neither blocks the other except where noted.
- **Shared dependency:** product multiplayer (per-section comments, real-time editing) needs platform **P0 Organizations** + **P1 roles** underneath. Sequence accordingly.
- **Shared seams** are owned here (Integrations, collaboration, usage analytics) — the product roadmap references rather than re-lists them.

## Maintenance

- New idea? Apply the filing rule above; if it's a seam, pick one owning roadmap and cross-reference.
- Reconcile against `git log` like `roadmap.md`; mark rungs shipped; link a `docs/specs/*` brief when a rung is about to be built.
- Architecture for a specific rung goes in `architecture.md`, not here.
