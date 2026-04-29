# Roadmap

> Forward-looking, suggested, not committed. Each version represents a coherent slice of work that ships meaningful user value. Ordering reflects dependencies and leverage, not deadlines. Update this doc when scope or priorities shift.

## Mission

The product is a **control plane for product → engineering translation**: it transforms a vague feature idea into a structured `FeatureSpec` and a deterministic `ImplementationPlan`, with the human in the loop at every step. The roadmap should make that translation loop tighter at every version.

## Current state — v0.1 ✓

The minimum viable pipeline runs end-to-end:

- Create project (greenfield or existing system)
- Enter feature idea → AI clarifying questions → user answers
- AI drafts `FeatureSpec` → user edits + approves
- AI generates `ImplementationPlan` (steps grouped by area, file changes, test plan, risks)
- Export spec + plan as JSON or Markdown

Underlying tech: Next.js 16 + RSC + Server Actions, Prisma on Neon Postgres, Anthropic SDK with structured tool-use output (Haiku for questions, Sonnet for spec, Opus for plan), Zod-everywhere validation, monorepo with `domain` / `db` / `ai` packages.

What v0.1 does **not** include: auth, repo indexing, GitHub integration, spec versioning, streaming, multi-provider.

---

## v0.2 — Ready for a real team

**Theme:** turn the prototype into something you can put in front of teammates without apologizing.

- **Auth + multi-tenancy** (architecture.md §11). `User` model, scope `Project.userId`, sign-in flow. Probably NextAuth or Clerk. Without this, you can't share with anyone.
- **UI polish.** shadcn/ui migration for the spec editor (the longest form on the site), `sonner` for toast notifications, loading skeletons during AI calls.
- **Streaming spec generation.** User watches the spec materialize instead of staring at a spinner for 20+ seconds. Big perceived-quality improvement.
- **Spec / plan templates.** Pre-built starter templates ("Frontend feature with new UI", "API endpoint", "Migration", "Background job") that pre-fill mode and seed sections.

This is the version where you'd onboard the first 5 paying customers.

## v0.3 — Ground the AI in real code

**Theme:** make `existing_system` mode actually live up to its name. Today the LLM only sees the user's typed description; it never sees the codebase.

- **Connect a GitHub repo to a project** (read-only OAuth). Index the repo: file tree, key files, framework detection.
- **Code-aware prompts.** Pass relevant file snippets / symbol references into `generateQuestions` and `generateSpec` so they ask grounded questions like *"you already have a `User` model in `src/db/models/user.ts` — should this feature add fields there or a related table?"*
- **Vector retrieval.** Embed code chunks; retrieve top-K based on the feature idea and the spec sections that need context.
- **Convention inference.** Automatically detect ESLint, Prettier, test stack, and common patterns; surface them in the spec's "respect existing conventions" section and in the plan's `fileChanges`.

This is the **highest-leverage** version on the roadmap. v0.3 is where the product becomes meaningfully different from "ChatGPT with a nice form." Cursor reads code to autocomplete; this reads code to disambiguate requirements.

## v0.4 — Close the loop to PRs

**Theme:** the plan stops being a doc and becomes actual code-on-a-branch.

Two flavors of PR creation, deliberately staged:

1. **Doc-only PR** (low risk, broad applicability). The action writes `docs/specs/<feature-slug>.md` and `docs/plans/<feature-slug>.md` to a feature branch, opens a PR with the plan as the description. Every team can use this without trusting the AI to write code.
2. **Scaffolded PR** (higher value, higher risk). The action creates the files mentioned in `plan.fileChanges` with stub implementations matching each step. Each step in the plan becomes a checkbox in the PR description.

Plus:
- **PR-spec linkback.** The feature page shows the open PR's status (open / merged / closed) inline.
- **Iteration ingestion.** When the PR gets merged, capture the diff vs. the original plan ("plan said X files; reality wrote Y") to inform future plan generation.

## v0.5 — Versioning, diffs, collaboration

**Theme:** specs and plans become first-class artifacts that change over time and that multiple people contribute to.

- **Versioning** (architecture.md §11). Every save creates a version. History UI on the feature page.
- **Diff view.** What changed between v3 and v4 of this spec? Critical when a PR review surfaces requirement changes.
- **Per-section comments.** Reviewers leave inline comments on the spec ("the assumption about auth is wrong") without editing.
- **Real-time collaboration.** Two PMs editing a spec simultaneously (Liveblocks or Yjs — moderate engineering work).

## v0.6 — Feedback loop / outcome tracking

**Theme:** the tool gets smarter the more you use it.

- **Outcome tracking.** Link merged PRs back to features. Surface metrics per project: "this feature took 3 days from spec → merged" / "5 PRs were needed to ship this".
- **Spec drift detection.** Periodically re-evaluate: "does the merged code still match the approved spec?" Surface drift to the team.
- **Plan accuracy feedback.** "The plan said 4 file changes; the merged PR had 11 — why?" Use this signal as context to improve future plan generation.
- **Effort estimation.** Predicted effort per spec based on past outcomes, refined over time.

## v1.0 — Enterprise readiness

**Theme:** every org has its own taste, stack, and tools.

- **Multi-LLM provider abstraction.** OpenAI, Anthropic, Gemini. Org chooses defaults; users can override per-step.
- **Org-level prompt customization.** Tune system prompts to a team's voice and style without forking the codebase.
- **Custom schema extensions.** Add fields to `FeatureSpec` (e.g., "compliance review status", "PII flags") via configuration.
- **External integrations.** Webhooks → Slack / Linear / Jira. Spec approval auto-creates a Linear ticket; PR merge posts to Slack with the original spec linked.

---

## Beyond v1.0 — strategic bets

Each of these would change the category we compete in. Pick selectively based on customer signal.

- **Figma integration** (architecture.md §11). Extract design intent from a Figma file into `userFlows` and `uiStates`. Closes a loop product teams actually live in.
- **Notion / PRD ingestion.** Point at a Notion page, extract a draft `FeatureSpec` automatically. Removes the "blank page" friction.
- **Multi-feature / portfolio planning.** "We want to ship X by Q3 — what features?" The tool generates a roadmap, not just one spec.
- **Spec → test generation.** Feed `acceptanceCriteria` into a test generator; produce Playwright / Vitest stubs.
- **Spec → architecture diagrams.** Mermaid output of data flows from `userFlows` + `dataChanges` + `apiChanges`.

---

## How to read this roadmap

- **v0.2 → v0.4 are sequential.** Auth unblocks sharing, repo grounding makes the spec quality leap, PRs make the work tangible. Don't shuffle their order.
- **v0.5 → v1.0 can interleave with the above** based on customer signal. Versioning is broadly useful but not blocking; multi-provider is critical for enterprise but not for early adopters.
- **Strategic bets are deliberately not numbered.** They're optional and depend on which customer segment matters most.
- **The single highest-leverage move is v0.3 (code-aware grounding).** That's where the product earns its narrative against Cursor / Copilot / Devin. Auth (v0.2) is plumbing; PRs (v0.4) put pressure on spec quality, which v0.3 delivers.

## Maintenance

- Update this doc when scope changes — don't let it drift from reality.
- When a version ships, mark it ✓ and move work to the appropriate later version (don't delete history; it's useful context).
- Architecture decisions specific to a version go in `architecture.md`, not here.
