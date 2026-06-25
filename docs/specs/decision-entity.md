# Feature brief — The `Decision` entity (provenance spine seam)

> Status: **PR 1 implemented** on `spec/decision-entity`. Implements the data-model call in [`../decisions/0001-decisions-not-tickets.md`](../decisions/0001-decisions-not-tickets.md) and the Phase 2 "Provenance MVP" in [`../roadmap.md`](../roadmap.md). This is the seam the `Initiative → Decision → Feature → Change` spine grows along — introduced as a **refactor of an existing JSON blob**, not a net-new feature.
>
> **Implementation note (PR 1):** the live DB had **0 rows** with `transcriptContext`, so the planned backfill + deprecate-then-drop was unnecessary — `transcriptContext` is dropped directly in the same migration, with every reader/writer re-routed to `Decision` rows in the same PR. The supersession self-relation and `supersedeDecision` were also cut from PR 1 (no edit path exists yet to use them); `status` keeps `SUPERSEDED`/`REJECTED` as reserved values.

## Goal

Promote the choices that shape a feature from scattered, unaddressable state into a first-class **`Decision`** record: an addressable, provenance-bearing row for a single resolved choice — *what* was decided, *why*, *from which source*, and its *status*.

Today those choices live in four places with no through-line: `Feature.transcriptContext` (a `Json?` blob of `{decisions, constraints, openQuestions}`), the clarifying `answers`, the baked-in `spec`, and lost-on-edit human changes. The Decision entity makes each choice a row, so the spec becomes a **materialized view** over a durable **decision log** (which complements the snapshot history already in `SpecVersion`).

## Why

Per the ADR, in an AI-driven world the decision layer is the bottleneck and the moat: it's the agent's grounded context, the thing drift is measured against, and the source a ticket is *projected* from. Everything downstream — tickets-out (projection), spec-as-contract, drift detection, per-decision comments — requires decisions to be **addressable rows**. And the longer the `Project → Feature` schema runs without it, the more expensive the retrofit (the ADR's "decide before it's load-bearing").

## Scope (smallest version that fits)

**PR 1 (this brief):** introduce the entity and re-route the *existing* transcript flow through it, with **no UX change**.

In scope:
1. `Decision` Prisma model + enums; additive migration.
2. One-time **backfill** of existing `Feature.transcriptContext` blobs → `Decision` rows.
3. `@repo/db` repo functions + `DecisionRecord` type.
4. `@repo/domain` Zod schema for the record + enums.
5. `extractFromTranscript` writes `Decision` rows (kind-tagged, `sourceType=transcript`).
6. Questions/spec steps read decisions instead of the blob — **behavioural parity**, via a `renderDecisionsContext()` that produces the same grounding string.

Explicitly **deferred** (design for it, do not build in PR 1):
- **Spec-field ↔ decision link** (the provenance join) — lands with the *spec-as-contract* move; §7 designs it so PR 1 doesn't preclude it.
- **Other decision sources** — `clarifying_answer`, `human_edit`, `ai_proposal`. The `sourceType` enum reserves them; only `transcript` is wired now.
- **`Initiative` attachment** — a future additive `initiativeId` column when that table lands. Not added now (dead FK otherwise).
- **A decisions UI / board, accept-workflow, supersede UX** — capture + consume first; surfacing comes with spec-as-contract.

## Design

### 1. Data model — `packages/db/prisma/schema.prisma`

```prisma
enum DecisionKind   { DECISION  CONSTRAINT  OPEN_QUESTION }
enum DecisionStatus { OPEN  ACCEPTED  SUPERSEDED  REJECTED }
enum DecisionSource { TRANSCRIPT  CLARIFYING_ANSWER  CONTEXT_DOC  HUMAN_EDIT  AI_PROPOSAL }

model Decision {
  id          String         @id @default(cuid())
  featureId   String
  feature     Feature        @relation(fields: [featureId], references: [id], onDelete: Cascade)

  kind        DecisionKind
  status      DecisionStatus
  statement   String
  rationale   String?

  // Provenance — same (sourceType, sourceId) shape already used by retrieval
  // (ProjectContextDoc / embeddings). sourceId is interpreted per sourceType.
  sourceType  DecisionSource
  sourceId    String?
  createdBy   String         // user id, or "ai" for machine-distilled

  // Supersession (light for now; powers the decision log over time)
  supersededById String?     @unique
  supersededBy   Decision?   @relation("Supersedes", fields: [supersededById], references: [id])
  supersedes     Decision?   @relation("Supersedes")

  createdAt   DateTime       @default(now())
  decidedAt   DateTime?

  @@index([featureId])
  @@index([featureId, status])
}
```

Status at creation maps from today's extraction semantics, preserving meaning:
`decisions → (DECISION, ACCEPTED)`, `constraints → (CONSTRAINT, ACCEPTED)`, `openQuestions → (OPEN_QUESTION, OPEN)`.

`Feature` gains `decisions Decision[]`.

### 2. Migration & backfill (additive, safe)

- **Migration A (additive):** create `Decision` + enums. Nothing dropped.
- **Backfill:** a one-shot script (`packages/db/scripts/backfill-decisions.ts`, run via `dotenv -e ../../.env -- tsx`) reads every `Feature.transcriptContext`, parses it with the existing `TranscriptExtractionSchema` shape, and inserts the three kinds as rows (`sourceType=TRANSCRIPT`, `sourceId = feature.id`, `createdBy = "ai"`). **Idempotent**: skip a feature that already has `TRANSCRIPT` decisions.
- **`transcriptContext` is kept, deprecated** for one release (dual-read safety), dropped in a later migration once the read path is fully on `Decision`. No data is destroyed in PR 1.

### 3. Repo layer — `packages/db/src/repos/decisions.ts`

`DecisionRecord` (Prisma row → record, like `ProjectRecord`). Functions, all scope-checked by the **caller** through the existing `requireMyProject`/feature ownership (no new auth):
- `createDecisions(featureId, inputs: NewDecision[])` — bulk insert (the extract step writes a batch).
- `listDecisionsByFeature(featureId, opts?: { statuses?: DecisionStatus[] })`.
- `supersedeDecision(id, replacementId)` — sets status + link (reserved for the edit path; minimal use now).

### 4. Domain schema — `packages/domain/src/schemas/decision.ts`

`DecisionKindSchema` / `DecisionStatusSchema` / `DecisionSourceSchema` (Zod enums mirroring Prisma), `DecisionRecordSchema`, and `NewDecisionSchema` (insert shape). Types inferred via `z.infer`. Unit tests: one valid + two invalid per conventions §15.

### 5. `extractFromTranscript` writes decisions — `_actions/transcript.ts` + the AI step

The AI step's output shape is unchanged (`{title, idea, decisions[], constraints[], openQuestions[]}`). The **action** changes: after creating the feature, instead of stashing `transcriptContext`, it calls `createDecisions(featureId, …)` mapping the three arrays to kind/status per §1. Thin orchestration only (conventions §6). The mandatory human-review-before-spec gate is unchanged.

### 6. Feed-forward — questions/spec read decisions (parity)

`lib/transcript-context.ts`'s `renderTranscriptContext()` is replaced by `renderDecisionsContext(decisions)` that emits the **same** grounded prose block (Decided / Constraints / Open questions) the prompts already expect. `generateQuestions` and `generateSpec` call sites swap `transcriptContext` for `listDecisionsByFeature(featureId, { statuses: [ACCEPTED, OPEN] })`. Net prompt input is identical → no generation regression. Verified by a snapshot test (§Testing).

### 7. Spec-field ↔ decision link (designed, **deferred** to spec-as-contract)

The provenance join that powers "why is this field here?" and drift detection:

```prisma
model SpecFieldDecision {
  id         String   @id @default(cuid())
  featureId  String
  specPath   String   // dotted path into FeatureSpec, e.g. "acceptanceCriteria.3"
  decisionId String
  // … relations, @@unique([featureId, specPath, decisionId])
}
```

PR 1 must not preclude this: keep `Decision.id` stable and addressable, and have the spec step *aware of which decisions it consumed* (so the link can be populated later without re-deriving). **Not built now.**

## Risks

- **Backfill correctness** — old blobs may not parse cleanly; validate with the Zod schema, log-and-skip malformed entries, make the script idempotent and re-runnable.
- **Generation regression** — the prompt grounding must stay byte-identical; gate on a snapshot diff of the rendered context before/after.
- **Premature breadth** — resist wiring `human_edit`/`ai_proposal` sources or the spec link now; the value of PR 1 is the seam, not coverage.
- **Status semantics** — AI-distilled "decisions" are treated `ACCEPTED` to preserve today's behaviour; the explicit human accept/supersede workflow is a deliberate later move, not a silent default to wire now.
- **Dedup** — re-running extraction could duplicate decisions; key the backfill/extraction on `(featureId, sourceType, statement)` to stay idempotent.

## Testing (per conventions §11 / §15)

- Zod schemas: one valid, two invalid each.
- Repo functions: create/list/supersede against the test DB.
- Backfill: idempotency (run twice → same rows) + a malformed-blob skip case.
- `renderDecisionsContext`: snapshot equal to the old `renderTranscriptContext` for the same content (parity guarantee).
- Integration: transcript → decisions rows, with the Anthropic client mocked at the SDK boundary.

## Done when

One PR: `Decision` model + enums + additive migration + idempotent backfill + repo functions + domain schema + `extractFromTranscript` writing rows + questions/spec reading them, all green (`typecheck`/`lint`/`test`/`test:integration`), the human-review gate intact, and a snapshot proving prompt-grounding parity. `transcriptContext` retained-but-deprecated; spec-field link and non-transcript sources explicitly not built.
