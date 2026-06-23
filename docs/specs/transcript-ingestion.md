# Feature brief — Transcript ingestion

> Status: **✅ shipped (2026-06-23).** This brief is kept as the design record. The feature is live; see `architecture.md` §10 (Grounding & retrieval) for how it works in the codebase and `roadmap.md` Foundation for status.

## Goal

Let a user start a feature from a **refinement-meeting transcript** instead of a typed idea. The system distills the transcript into a `idea` plus surrounding context; the user reviews/edits; the normal `questions → answers → spec → plan` pipeline then runs, grounded in the discussion.

Today a `Feature` starts with a typed `idea`. Transcript ingestion sits *in front* of that step. It does **not** replace the pipeline — it seeds it.

## Why

`Vision.md` §10 names meeting transcripts as the first integration to deepen ("rawest, most valuable context, no good competitor"). The current product's only input is a typed idea, which is what makes it feel like "ChatGPT with a nice form." This is the feature that turns it into the Loop wedge.

## Scope (smallest version that fits)

In scope:

1. A new AI step that extracts structure from a pasted transcript.
2. A Zod schema for the extraction output.
3. An additive Prisma migration to persist the transcript + extracted context on `Feature`.
4. A thin Server Action.
5. A second mode on the "new feature" form ("Paste a transcript").
6. Feed the extracted context forward into the existing questions/spec prompts.

Explicitly deferred (do **not** pre-build): file upload of `.vtt`/`.srt`/`.txt` (start paste-only), chunking for very long transcripts, and auto-answering generated questions from the transcript (strong v2 once extraction quality is proven).

## Design

### 1. AI step — `packages/ai/src/steps/extract-from-transcript/`

`index.ts` + `prompt.ts` + tests. Uses `runToolUse` with a Zod-derived JSON schema (same pattern as the other steps). Model: reuse the spec-class model (Sonnet) — reasoning-heavy, no new model entry needed. When a repo is connected, pass in the same retrieved snippets + convention summary the spec route already builds.

Output shape (defined as a Zod schema in `@repo/domain`, type inferred):

```ts
TranscriptExtraction = {
  title: string;
  idea: string;            // distilled problem / feature statement
  decisions: string[];     // what the discussion actually settled
  constraints: string[];   // assumptions / limits surfaced
  openQuestions: string[]; // left unresolved → seeds the questions/spec step
}
```

### 2. Schema — `packages/domain/src/schemas/transcript-extraction.ts`

`TranscriptExtractionSchema` + inferred type, plus the action input schema (`{ projectId, featureId | title, transcript }`). Unit tests: one valid + at least two invalid (conventions §15).

### 3. Migration (additive, safe)

Add to `Feature`:

```prisma
transcript        String?   // raw pasted transcript
transcriptContext Json?     // TranscriptExtraction minus idea/title
```

Both nullable → no backfill. Persisting this is also the first concrete **provenance** seam (roadmap Phase 2), not throwaway work.

### 4. Server Action — `extractFromTranscriptAction` (in `_actions/transcript.ts`)

Validate input with Zod → call the step (wire in repo retrieval when a repo exists) → save `transcript`, `transcriptContext`, and the pre-filled `idea`/`title` → `revalidatePath` → return `ActionResult<T>`. Thin orchestration only; no business logic in the action (conventions §6).

### 5. UI — new mode on the new-feature form

Toggle "Type an idea" / "Paste a transcript". The transcript path shows a textarea, calls the action, and lands the user on the feature page with `idea`/`title` pre-filled and the extracted context shown for review/edit **before** they continue. Human-in-loop review is mandatory — never auto-advance to spec.

### 6. Feed-forward

Pass `transcriptContext` into the existing `generateQuestions` and `generateSpec` prompts so the whole pipeline is grounded in the meeting, and seed the spec's `assumptions` / `openQuestions` from it.

## Risks

- **Long transcripts** can exceed `max_tokens` → paste-only v1; chunking is the first follow-up.
- **Multi-topic transcripts** may merge unrelated features → prompt for one feature at a time + mandatory human review.
- **PII** — transcripts carry sensitive content and we'd now persist them. Make storing it a deliberate decision (retention, encryption-at-rest like repo tokens?).
- **Hallucinated "decisions"** → human review required before the spec step; never auto-advance.

## Testing (per conventions §11 / §15)

- Zod schema: one valid, two invalid.
- Prompt builder: snapshot test against a fixture transcript.
- Step: fixture-response Zod test.
- Integration: transcript → extraction with the Anthropic client mocked at the SDK boundary.

## Done when

One PR: new step + schema + additive migration + action + form mode, all green (`typecheck`/`lint`/`test`/`test:integration`), with the human-review gate in place before the spec step.
