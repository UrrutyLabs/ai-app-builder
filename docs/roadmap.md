# Roadmap

> Forward-looking, suggested, not committed. Ordering reflects dependencies and leverage, not deadlines. Update this doc when scope or priorities shift.
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

- **Tickets out** — export an approved spec to Linear/Jira with acceptance criteria. The product currently stops at spec/plan/PR; this is the missing exit (Vision §3).
- **Provenance MVP** — record the *source* of each spec field (transcript / doc / AI / human edit). First concrete step toward the `Initiative → Decisions` spine (Vision §5). **See the strategic call below.**
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

## The strategic call to make before Phase 2

**Migrate the data model toward the Loop spine now, or ride the current schema and migrate later?**

Today's schema is `Project → Feature → Spec/Plan/PR`, single-player. `Vision.md` §5 describes a different spine — `Initiative → Decisions → Tickets → Changes`, with per-field provenance and queryable lineage — and says "get it right early." These don't match.

- **Ride it** → fastest path to validating the wedge; every week of build adds migration cost later.
- **Migrate now** → slower to first users, but avoids re-platforming once provenance and multiplayer become load-bearing.

Recommended: ride it through Phase 1, then introduce the **Phase 2 provenance MVP** as the seam the later migration happens along — so the schema bends toward `Initiative` before it's expensive to change. Context docs and transcripts already give every retrievable chunk a stable `(sourceType, sourceId)`; that's the seam. Decide deliberately; don't let it default.

---

## How to read this roadmap

- **Phases 1 → 3 are sequential and oriented at one outcome: real teams using it.** Phase 1 is mostly stabilization + deploy, not new features.
- **The highest-leverage features (grounding: code, transcripts, docs) are shipped.** The next net-new frontier is **tickets out** (Phase 2) — the wedge's actual output.
- **The data-model decision is the highest-stakes architectural call**, broken out above because it shapes everything after the wedge is validated.
- **Phases 4 → 5 can interleave** with the above based on customer signal.

## Maintenance

- Update this doc when scope changes — don't let it drift (it has before; that's why status is reconciled against `git log`).
- When something ships, move it to **Foundation** and keep the parenthetical history.
- Architecture decisions go in `architecture.md`; the product north star in `Vision.md`.
