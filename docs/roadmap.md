# Roadmap

> Forward-looking, suggested, not committed. Ordering reflects dependencies and leverage, not deadlines. Update this doc when scope or priorities shift.
>
> **Scope: the product wedge.** This roadmap covers what makes the *idea → spec → plan → PR* translation better. The conventional SaaS console (orgs, billing, account, settings, audit) lives in [`platform-roadmap.md`](platform-roadmap.md) — see its filing rule before adding an item to either.
>
> **Last reconciled against `git log` on 2026-06-23.** Status reflects what's actually in the repo, not what was originally planned.
>
> **One scheme.** Earlier drafts mixed `v0.x` version tags with `Phase X` labels. They're now unified: everything shipped is collapsed into **Foundation** below; all forward work is a single **Phase 1 → 5** sequence ordered by leverage. The old `v0.x` tags are retired (kept only as parentheses where useful for git archaeology).

## Mission

The product is a **control plane for product → engineering translation**: it turns a vague feature idea — or a refinement-meeting transcript — into a structured `FeatureSpec`, a deterministic `ImplementationPlan`, and real code on a PR branch, with the human in the loop at every step.

The north star (see `Vision.md`, working name **Loop**) is the shared workspace where product and engineering decide together and ship together: one living artifact with full provenance from refinement discussion → decision → ticket → code. The phases below are the path from today's working pipeline toward that.

---

## Foundation — shipped

Built, committed, and reconciled against the codebase. This is the working pipeline everything else extends.

- **Core pipeline** — create project → idea → AI clarifying questions → answers → `FeatureSpec` → edit/approve → `ImplementationPlan` → export JSON/Markdown. *(was v0.1)*
- **Auth + multi-tenancy** — Neon Auth, `Project.userId` scoping, sign-in, orphan-claim. *(was v0.2)*
- **Code grounding** — connect a GitHub repo, index it (pgvector), infer conventions, retrieve into prompts. *(was v0.3)*
- **PR creation + code generation** — doc-only / stubs / generate modes; typecheck + verify + repair loop, SEARCH/REPLACE edits, cross-file consistency pass, streaming progress UI, PR sync-back. *(was v0.4)*
- **Spec versioning** — `SpecVersion` per save, diff view, history page. *(was v0.5)*
- **Streaming spec generation** — SSE; the spec materializes as it's produced.
- **Transcript ingestion** — paste a refinement transcript → distilled idea + decisions/constraints/open-questions → human review → seeds the pipeline. Brief: [`docs/specs/transcript-ingestion.md`](specs/transcript-ingestion.md).
- **Project context documents** — attach PRD / domain-model / notes; chunked, embedded, retrieved alongside the repo via a unified `retrieveProjectContext`. Brief: [`docs/specs/project-context-docs.md`](specs/project-context-docs.md).

**Net:** *typed idea or transcript + connected repo + project docs → spec → plan → generated code on a PR*, behind auth. Stack: Next.js 16 (RSC + Server Actions), Prisma on Neon (pgvector), Anthropic tool-use (Haiku/Sonnet/Opus), OpenAI embeddings, Zod everywhere, `domain` / `db` / `ai` / `repos` monorepo packages.

---

## Phase 1 — Ship it to first users

The grounding features are done; what's left is non-feature work to get this in front of 3–5 design-partner teams (Vision §10).

- **Onboarding polish** — loading skeletons + `sonner` toasts for AI calls; connect-repo + first-feature without hand-holding. *(carried from the original v0.2 polish list)*
- **Deploy behind auth** — Vercel + Neon; a hosted instance partners can reach. *(unblocked; deferred by choice while still building features)*
- **Smoke-test the full pipeline** end-to-end on one real repo before showing it.
- **Run one real refinement** of your own team through it. What breaks becomes the Phase 2 backlog.

## Phase 2 — Close the loop to delivery

Make a handful of teams sticky (Vision §10). This is where the wedge produces its actual output.

- **Tickets out (projection)** — render + sync an approved spec to Linear/Jira with acceptance criteria. A ticket is an *emitted view*, not the source of truth; this is the missing exit (Vision §3).
- **Provenance MVP = the `Decision` entity** — record the *source* of each spec field (transcript / doc / AI / human edit) as first-class, provenanced decisions. The seam toward the `Initiative → Decision → Feature → Change` spine; see [`decisions/0001`](decisions/0001-decisions-not-tickets.md).
- **PR-quality hardening** against partners' real repos — the codegen loop's failure modes only surface on real codebases.

## Phase 3 — Collaboration & multiplayer

Move from single-PM to a team editing one artifact.

- **Per-section spec comments** — reviewers comment without editing. *(planned in v0.5, never built)*
- **Real-time collaboration** — two people editing a spec live (Liveblocks/Yjs).
- **Backward into refinement** — a multiplayer surface during the meeting itself.
- **Forward into review** — provenance-rich PRs whose review comments update the artifact.

## Phase 4 — Compounding intelligence

The tool gets smarter the more it's used. *(was v0.6)*

- **Outcome tracking** — link merged PRs back to features; surface "spec → merged" cycle time.
- **Spec-drift detection** — does merged code still match the approved spec?
- **Plan-accuracy feedback** — "plan said 4 file changes, PR had 11 — why?"
- **Effort estimation** — refined over past outcomes.

## Phase 5 — Enterprise & breadth

Every org has its own taste, stack, and tools. *(was v1.0 + strategic bets)*

- **Multi-LLM provider abstraction** — OpenAI / Anthropic / Gemini, per-step override.
- **Org-level customization** — prompt tuning, custom `FeatureSpec` fields (compliance status, PII flags).
- **External integrations** — webhooks → Slack / Linear / Jira; spec approval auto-creates a ticket; PR merge posts to Slack.
- **Richer context sources** — binary docs (PDF/DOCX), feature-scoped context docs, Notion ingestion, Figma design-intent → `userFlows` / `uiStates`. All generalize from today's `ProjectContextDoc`.
- **Category bets** (on customer signal) — portfolio planning ("ship X by Q3 — what features?"), spec → test generation, spec → architecture diagrams.

---

## The strategic call before Phase 2 — ✅ decided

**Decided 2026-06-25:** [`docs/decisions/0001-decisions-not-tickets.md`](decisions/0001-decisions-not-tickets.md) — *model the decision, emit the ticket.*

Today's schema is `Project → Feature → Spec/Plan/PR`, single-player. Rather than the `Initiative → Decisions → Tickets → Changes` spine sketched earlier, the spine is **`Initiative → Decision → Feature → Change`**: a **`Decision`** is a first-class, provenanced node; a **ticket is a projection** Loop emits and syncs, not an internal entity.

- **Ride the current schema through Phase 1.**
- In **Phase 2**, build the **Provenance MVP *as* the `Decision` entity** — the seam the migration happens along — on the stable `(sourceType, sourceId)` that context docs and transcripts already attach to every chunk.
- **"Tickets out" is render + sync** (an integration boundary), not authorship. Don't build the portfolio/board layer yet; model `Initiative`/`Decision` so Loop can absorb it once agent volume makes the external board the bottleneck.

Rationale (incl. why an AI-driven future *strengthens* this) is in the decision record.

---

## How to read this roadmap

- **Phases 1 → 3 are sequential and oriented at one outcome: real teams using it.** Phase 1 is mostly stabilization + deploy, not new features.
- **The highest-leverage features (grounding: code, transcripts, docs) are shipped.** The next net-new frontier is **tickets out** (Phase 2) — the wedge's actual output.
- **The data-model decision is settled** ([`decisions/0001`](decisions/0001-decisions-not-tickets.md)) — decision is a node, ticket is a projection — and it shapes everything after the wedge is validated.
- **Phases 4 → 5 can interleave** with the above based on customer signal.

## Maintenance

- Update this doc when scope changes — don't let it drift (it has before; that's why status is reconciled against `git log`).
- When something ships, move it to **Foundation** and keep the parenthetical history.
- Architecture decisions go in `architecture.md`; the product north star in `Vision.md`.
