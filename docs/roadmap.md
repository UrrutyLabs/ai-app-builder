# Roadmap

> Forward-looking, suggested, not committed. Each version represents a coherent slice of work that ships meaningful user value. Ordering reflects dependencies and leverage, not deadlines. Update this doc when scope or priorities shift.
>
> **Last reconciled against `git log` on 2026-06-23.** Status flags below reflect what's actually in the repo, not what was originally planned.

## Mission

The product is a **control plane for product → engineering translation**: it transforms a vague feature idea into a structured `FeatureSpec`, a deterministic `ImplementationPlan`, and — increasingly — real code on a PR branch, with the human in the loop at every step. The roadmap should make that translation loop tighter at every version.

The longer-term north star (see `Vision.md`, working name **Loop**) is the shared workspace where product and engineering decide together and ship together: a single living artifact with full provenance from refinement discussion → decision → ticket → code. The versions below are the path from today's working pipeline toward that.

---

## Current state — shipped through ~v0.5 (with v0.2 auth landed last)

The product is **well past** the original "v0.1 export-only" milestone. From git history, the following slices are built and committed:

- **v0.1 ✓** — Core pipeline end to end: create project → idea → AI clarifying questions → answers → AI `FeatureSpec` → edit/approve → AI `ImplementationPlan` → export JSON/Markdown.
- **v0.3 ✓** — Code grounding is real: connect a GitHub repo, index it (`Repo` + `RepoFileEmbedding` with pgvector `vector(1536)`), convention inference stored on `Repo.conventions`, retrieval into prompts. `OPENAI_API_KEY` wired for embeddings.
- **v0.4 ✓ (+ v0.4c) — the big one:** PR creation **and actual code generation**, not just stubs. `packages/ai/src/steps/generate-file` does apply-edits, a typecheck loop, a verify pass, SEARCH/REPLACE for large-file modifies, and a cross-file consistency pass. Plus streaming progress UI for PR creation and PR sync-back to the feature page (`prUrl` / `prCreatedAt` on `Feature`).
- **v0.5 ✓ (partial)** — Spec versioning (`SpecVersion` model) + diff view + history page. PR sync-back. **Not yet built:** per-section comments, real-time collaboration.
- **v0.2 ✓ (landed most recently)** — Neon Auth + multi-tenancy. `Project.userId` scoping, sign-in flow, orphan-claim banner. This was built *after* v0.3–v0.5; auth was the last plumbing piece rather than the first.

- **Streaming spec generation ✓** — `api/spec/stream` (SSE), `generate-spec/stream.ts`, live preview in `generate-spec-button`. The spec materializes as the LLM produces it.
- **Transcript ingestion ✓** — paste a refinement transcript → `extract-from-transcript` step distills title/idea/decisions/constraints/openQuestions → human review → seeds the existing pipeline. `Feature.transcript` / `transcriptContext` persisted. This was Phase 1's flagged highest-value feature; it's now built.
- **Project context documents ✓** — attach PRD / domain-model / notes (`.md`/`.txt`) to a project; chunked + embedded (`ProjectContextDoc` + `ProjectContextDocEmbedding`) and retrieved into question/spec/transcript prompts via a unified `retrieveProjectContext` helper alongside the repo index. First grounding source beyond the repo; the concrete pattern a later `ContextSource` generalization (Notion/Figma/PDF) will build on. Brief: [`docs/specs/project-context-docs.md`](specs/project-context-docs.md).

Underlying tech: Next.js 16 + RSC + Server Actions, Prisma on Neon Postgres (pgvector), Anthropic SDK with structured tool-use output (Haiku for questions, Sonnet for spec, Opus for plan), OpenAI for embeddings, Zod-everywhere validation, monorepo with `domain` / `db` / `ai` packages.

**Net:** the product already does *typed idea + connected repo → spec → plan → generated code on a PR*, behind auth. The remaining work to get real users is less about new features and more about stabilizing, deploying, and adding the one input that makes it the Loop wedge: the refinement transcript.

---

## Path to users

The next four versions are sequenced by one goal: **get this in front of real teams.** Per `Vision.md` §10, "users" here means yourself plus 3–5 design-partner teams running a real refinement — not a public launch.

### Phase 0 — Ground truth (days)

Stabilize what exists so it can be shown without breaking.

- **Resolve the in-flight streaming work** — finish it or stash it; commit a clean tree.
- **Confirm green** — `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration`, and a build. (Could not be verified from the planning sandbox; treat as the first gate.)
- **Smoke-test the full pipeline** on one real repo, end to end: connect repo → idea → spec → plan → generated PR.
- **Keep this doc and `architecture.md` honest** — they had drifted to claiming "current state: v0.1." Don't let that recur.

### Phase 1 — First real users (Vision §10's "next 4 weeks")

- **Transcript ingestion ✓** — shipped. Paste a refinement transcript → distilled idea + extracted decisions/constraints/open-questions → human review → seeds the pipeline. This was the single highest-value feature on the list and is done. Brief: [`docs/specs/transcript-ingestion.md`](specs/transcript-ingestion.md).
- **Project context documents ✓** — shipped. Attach PRD / domain-model / notes; grounded into every feature alongside the repo. Brief: [`docs/specs/project-context-docs.md`](specs/project-context-docs.md).
- **Deploy behind auth.** Auth landed, so this is unblocked. Vercel + Neon is already the stack; stand up a hosted instance design partners can reach. **Deferred by choice** — still building features before deploying.
- **Onboarding under 10 minutes** — connect repo + create first feature without hand-holding. Loading skeletons + `sonner` toasts for AI calls (carried over from the original v0.2 polish list). **Still pending.**
- **Run one real refinement of your own team through it.** Whatever breaks is the Phase 2 backlog; whatever works is the design-partner demo.

### Phase 2 — Make it sticky for a handful of teams (Vision §10's "weeks 4–12")

- **Tickets out.** Export an approved spec to Linear/Jira tickets with acceptance criteria. This is the wedge's actual output (Vision §3) and is currently missing — the product stops at spec/plan/PR.
- **Provenance MVP.** Start recording the *source* of each spec field (transcript vs. AI vs. human edit). This is the first concrete step toward the Initiative/lineage spine (Vision §5) — see the strategic call below.
- **Per-section spec comments.** Planned in v0.5, never built. Needed before a team — not just one PM — can collaborate on a spec.
- **Harden PR quality** against design partners' real repos. The codegen + typecheck loop will surface failure modes only real codebases expose.

### Phase 3 — Extend in both directions (Vision §10's "months 3–6")

- **Backward into refinement** — a multiplayer surface during the meeting itself.
- **Forward into review** — provenance-rich PRs whose review comments update the artifact.
- **Figma** — extract design intent into `userFlows` / `uiStates`.

---

## The strategic call to make before Phase 2

**Do we migrate the data model toward the Loop spine now, or ride the current schema and migrate later?**

Today's schema is `Project → Feature → Spec/Plan/PR`, single-player. `Vision.md` §5 describes a different spine: `Initiative → Decisions → Tickets → Changes`, with per-field provenance and queryable lineage, and explicitly says "get it right early." These don't match.

- **Ride the current schema** → fastest path to validating the wedge with design partners. Every week of build on it adds migration cost later.
- **Migrate now** → slower to first users, but avoids re-platforming once provenance and multiplayer become load-bearing.

Recommended: ride it through Phase 1 to validate the wedge, but introduce the **provenance MVP** in Phase 2 as the seam along which the later migration happens — so the schema starts bending toward `Initiative` before it's expensive to change. Decide deliberately; don't let it default.

---

## Later (unchanged in intent, now further out)

### v0.6 — Feedback loop / outcome tracking

The tool gets smarter the more you use it: outcome tracking (link merged PRs back to features, surface "spec → merged" cycle time), spec drift detection (does merged code still match the approved spec?), plan-accuracy feedback ("plan said 4 file changes, PR had 11 — why?"), effort estimation refined over past outcomes.

### v1.0 — Enterprise readiness

Every org has its own taste, stack, and tools: multi-LLM provider abstraction (OpenAI / Anthropic / Gemini, per-step override), org-level prompt customization, custom `FeatureSpec` schema extensions (compliance status, PII flags), external integrations (webhooks → Slack / Linear / Jira; spec approval auto-creates a ticket; PR merge posts to Slack with the spec linked).

### Beyond v1.0 — strategic bets

Each would change the category we compete in; pick on customer signal. Notion/PRD ingestion (kill the blank page), multi-feature/portfolio planning ("ship X by Q3 — what features?"), spec → test generation (acceptance criteria → Playwright/Vitest stubs), spec → architecture diagrams (Mermaid from `userFlows` + `dataChanges` + `apiChanges`). Figma is pulled forward into Phase 3 above.

---

## How to read this roadmap

- **Phases 0 → 3 are sequential and oriented at one outcome: real teams using it.** Phase 0 is a stabilization gate, not optional.
- **Transcript ingestion + project context docs (Phase 1) were the highest-leverage features and are now shipped.** Together they make the product the Loop wedge rather than a nicer spec form: refinement transcripts and ambient project docs are the "rawest, most valuable context" the Vision calls out. With those done, the remaining Phase 1 work is non-feature (deploy, onboarding polish), and the next net-new frontier is **tickets out** (Phase 2) — the wedge's actual output.
- **The data-model decision is the highest-stakes architectural call** and is deliberately broken out above, because it shapes everything after the wedge is validated.
- **v0.6 → v1.0 can interleave** with the above based on customer signal.

## Maintenance

- Update this doc when scope changes — don't let it drift from reality (it already did once; that's why status is now reconciled against `git log`).
- When a version ships, mark it ✓ and keep the history; don't delete it.
- Architecture decisions specific to a version go in `architecture.md`, not here. The product north star lives in `Vision.md`.
