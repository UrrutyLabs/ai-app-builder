# Platform roadmap

> The **conventional** side of the product — the console and SaaS plumbing you'd build for *any* tool of this kind, regardless of what it does. Kept separate from `roadmap.md` (the product wedge) on purpose: mixing "make the spec pipeline better" with "build billing" makes both harder to read.
>
> **Last reconciled against `git log` on 2026-06-24.** Status reflects what's in the repo, not what was planned.
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

- **Identity & access** ✓ — Neon Auth (Better Auth) with the **organization plugin**: email sign-in; **organizations** (personal org auto-created on first workspace load, legacy projects backfilled into it); `Project.organizationId` scoping with **membership-verified** access (the active-org id is re-checked against live membership, fail-open on transient errors); a **real org switcher** (list / switch / create). Legacy `userId` fallback retained so nothing disappeared mid-migration.
- **Account** ✓ — Better Auth account surfaces wired at `/account` (profile, security, password, sessions, 2FA) via Neon Auth UI's `AccountView`; reachable from the account menu.
- **Settings** ✓ (partial) — org **name/slug editable** against the real org record; danger zone restyled. Org/project **delete** deliberately still disabled (wants a confirm flow).
- **Console UX** ✓ — two-tier shell: org-scoped nav (Projects · People · Billing · Integrations · Settings) and project-scoped nav (Overview · Settings); org + project switchers; account menu (account settings · theme · sign out); **collapsible icon-rail sidebar** (state persisted). Adaptive off the route.
- **Surfaces stubbed** — People, Billing (Free/Pro cards), Integrations (connector grid), and a usage-cards row on Projects remain intentional placeholders. The nav/UX is locked; those backends are not built.

**Platform briefs that already exist** (homeless until now — this doc owns them):
- `pricing.md` — pricing strategy (charge in feedback now; usage-based later given real COGS).
- `docs/specs/usage-instrumentation.md` — the Postgres cost ledger (tokens + $ per call, joinable to org/project/feature). The input to both Usage analytics and Billing.

---

## The keystone — ✅ shipped (P0)

Almost everything below was gated on one thing: **Organizations**. This is now in: the Better Auth `organization` plugin is adopted (orgs / members / invitations / roles), `Project.organizationId` exists with a migration, and access checks moved from "user owns project" to "user is a **member** of the project's active org." Each existing project was assigned to its owner's auto-created personal org; the legacy `userId` path is kept as a fallback.

With the keystone in, the placeholders can start becoming real — P1 onward.

---

## Capability pillars (the stable structure)

Each pillar has a maturity ladder (none → minimal → complete). Pillars are stable; the rungs are the work.

- **Identity & access** — auth ✓ → organizations ✓ → membership ✓ → roles/RBAC → SSO
- **Account** — profile ✓ → security (2FA / sessions) ✓ → notification prefs → personal API tokens
- **Billing & plans** — Stripe customer → plans → usage metering → invoices/payment → dunning/enterprise terms
- **Usage & observability** — cost ledger → usage dashboards → audit log → status/health
- **Integrations platform** — connector framework → GitHub App → Linear/Jira/Slack → webhooks/public API
- **Settings & config** — org settings ✓ → default models/policies → danger zone (styled; delete not wired)
- **Console UX** — shell ✓ (collapsible) → global search (⌘K) → notifications inbox → onboarding → help/changelog

---

## Phases

### P0 · Foundation (the keystone) — ✅ Shipped 2026-06-24
The unlock. Mostly auth + a migration; little net-new UI.
- **Identity & access** ✓ — Better Auth org plugin; `Project.organizationId` + migration; personal org auto-created (first workspace load) + legacy backfill; membership-verified access; real org switcher (list / switch / create).
- **Account** ✓ — Better Auth account surfaces wired (`/account`: profile, security, password, sessions, 2FA).
- **Settings** ✓ — org name/slug editable against the real org record.
- *Deferred:* org/project **delete** (disabled, needs a confirm flow); wiring the auth provider's nav to the Next router (account nav currently full-page reloads).

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
