# Feature brief — Create a feature from a document

> Status: **implemented** on `spec/decision-entity`. A third feature-creation mode alongside *typed idea* and *transcript*. Builds directly on the `Decision` entity ([`decision-entity.md`](decision-entity.md)) and the existing `ProjectContextDoc` system — **no schema change**, because the spine already reserved the `CONTEXT_DOC` source. The shared atomic write was generalized (`createFeatureFromTranscript` → `createFeatureWithDecisions`, optional transcript) since transcript + document are the second real case.

## Goal

Let a user start a feature from an **authored document** (PRD, requirements, design doc, notes) the way they already can from a transcript: the system parses the document into a `title` + `idea` + `Decision` rows, the human reviews, and the normal `questions → answers → spec → plan → PR` pipeline runs — grounded in the document, with each decision traceable back to it.

## Why

Documents are how most teams actually carry product intent. The Decision spine made adding a source *additive* (a new `sourceType`, not a new pipeline), so this is the natural next source after transcript — and it exercises the `CONTEXT_DOC` provenance we reserved.

## Decisions (settled while scoping — don't relitigate)

- **One mode, not two.** "Document" is a single mode; **PRD is a *genre* of document, not its own source**. At most a future prompt hint — never a separate `PRD` enum value or button.
- **Exactly one feature per document** (same assumption transcript makes). Multi-feature **segmentation is deferred** and is purely *additive* later (a "which feature(s)?" step in front), so constraining now costs nothing.
- **Route through `ProjectContextDoc`, not raw storage.** A document is durable and reused across features (it also grounds retrieval), so the seed *is* a `ProjectContextDoc` — not raw text on the feature like a transcript.
- **Don't prevent multi-feature inputs — detect and degrade gracefully.** The extractor returns the primary feature **plus** the other features it noticed, surfaced so nothing is silently dropped (see §5). This is segmentation's *detection* half, for free.
- **Epic is out of scope** — that's the `Initiative` hierarchy layer (a different axis), not a source.

## Scope (smallest version that fits)

In scope:
1. A document-aware extraction AI step + Zod output schema (incl. `otherFeaturesDetected`).
2. A `createFeatureFromDocument` repo fn — feature + `CONTEXT_DOC` decisions, atomic.
3. A thin Server Action that returns the new feature **and** the detected siblings (no redirect, so the client can surface them).
4. A third mode on the new-feature form: "From a document" + a picker over the project's existing context docs.
5. Surface `otherFeaturesDetected` at creation (toast / inline), then navigate to the feature.

Explicitly **deferred** (design for it, don't build):
- **Multi-feature segmentation / batch create**, and **persisting** the detected siblings for later (MVP surfaces them once at creation).
- **Section-level scoping** (heading picker) and section-level `sourceId` — `sourceId` is the whole-doc id for now.
- **Genre-specific prompts**, **inline upload** (use the existing context-doc upload), **long-doc chunking**, and a **size pre-warn**.

## Design

### 1. AI step — `packages/ai/src/steps/extract-from-document/`
`index.ts` + `prompt.ts` + tests. Same `runToolUse` pattern and **same output shape as the transcript step** plus one field, but a **different prompt**: a document has explicit structure, so this is a *parse/map* (Goals → idea; Requirements → decisions/constraints; "TBD"/gaps → open questions), not a *distill-from-noise*. Grounded by the repo + retrieved code + other context docs (`retrieveProjectContext`). Model: reuse the spec-class model (Sonnet).

Output (Zod in `@repo/domain`, type inferred):
```ts
DocumentExtraction = {
  title: string;
  idea: string;
  decisions: string[];
  constraints: string[];
  openQuestions: string[];
  otherFeaturesDetected: string[]; // one-line summaries of other features in the doc, NOT created
}
```

### 2. Domain schema — `packages/domain/src/schemas/document-extraction.ts`
`DocumentExtractionSchema` + inferred type + the action input (`{ projectId, contextDocId }`). The first five fields can share the transcript extraction's caps. Tests: one valid + two invalid.

### 3. Repo — `createFeatureFromDocument` (in `repos/features.ts`)
Sibling to `createFeatureFromTranscript`: atomically create the feature (title/idea — **no** raw transcript) and its `Decision` rows via the same `$transaction`. Decisions get `sourceType: "CONTEXT_DOC"`, `sourceId: <contextDocId>`, `createdBy: "ai"`, statuses as usual (decisions/constraints → `ACCEPTED`, open questions → `OPEN`). The doc stays a `ProjectContextDoc`.

### 4. Server Action — `extractFromDocumentAction` (in `_actions/document.ts`)
Validate input → `requireMyProject(projectId)` → load the doc via `getContextDocById` (verify it belongs to the project) → run the step over `doc.content` → `createFeatureFromDocument` → **return** `ActionResult<{ projectId; featureId; otherFeaturesDetected: string[] }>` (no `redirect`, so the client can show the siblings before navigating). Thin orchestration only.

### 5. UI — new mode + sibling surfacing
A "From a document" tab on the new-feature form with a picker over the project's `ProjectContextDoc`s. On submit → action → if `otherFeaturesDetected` is non-empty, a toast/inline note ("This document also describes: X, Y — create them separately"), then `router.push` to the feature. The feature page is unchanged — the Decisions panel already renders the `CONTEXT_DOC` decisions and the human reviews/accepts there.

## Risks
- **Mega-feature from a broad PRD** — mitigated by `otherFeaturesDetected` (the primary stays scoped; the rest are surfaced) + the review gate. Section scoping is the follow-up.
- **Long documents** exceed `max_tokens` — cap/guard like the transcript step; chunking deferred.
- **Hallucinated decisions** — human review/accept gate before the spec step (unchanged).
- **Doc with no real feature** (e.g. a glossary) — extraction should be allowed to return an empty/weak result; the review gate catches it.

## Testing (per conventions §11 / §15)
- Zod schema: one valid, two invalid.
- Prompt builder: snapshot against a fixture PRD.
- Step: fixture-response Zod test.
- Integration: document → feature + `CONTEXT_DOC` decisions, Anthropic mocked at the SDK boundary; assert `otherFeaturesDetected` is surfaced, not persisted.

## Done when
One PR: new step + schema + `createFeatureFromDocument` + action + form mode + sibling surfacing, all green (`typecheck`/`lint`/`test`/`test:integration`), decisions written with `CONTEXT_DOC` provenance, human-review gate intact, and **no schema migration**.
