# Feature brief — Usage & cost instrumentation

> Status: **planned, not started.** Groundwork for pricing — see `docs/pricing.md` ("Instrumentation — the actual build for this stage"). Read `architecture.md` and `conventions.md` before implementing. Scope is the Postgres cost ledger only; PostHog behavioral events are a separate, later PR.

## Goal

Capture every LLM and embedding call's token usage and dollar cost in our own Postgres, joinable to `Feature` / `Project` / user. This is the **financial source of truth** for cost-to-serve — the input the pricing strategy depends on. It is explicitly **not** a PostHog/analytics concern: analytics vendors sample, expire, and can't JOIN to our domain tables, and this data feeds margin math.

## Why this, why now

`docs/pricing.md`: at the design-partner stage, the price we eventually set should be arithmetic, not a guess. That requires knowing what an active team actually costs us to serve. Model calls already route centrally through `packages/ai/src/models.ts`, and `runToolUse` is the single chokepoint nearly every structured call passes through — so the capture point is small and well-defined. The `generate`-mode PR (Opus plan + Sonnet codegen typecheck-retry loop) is the cost-variance driver; retries are the hidden multiplier and must be counted.

## Hard constraint — dependency graph

`packages/ai` and `packages/repos` must **not** import `packages/db` (CLAUDE.md flags this as the rule most likely to be violated under pressure). Therefore the AI/embedding layers **return** usage data; the composing layer in `apps/web` (server actions, `lib/pr-runner.ts`, `app/api/spec/stream/route.ts`) persists it via `@repo/db`. `ai`/`repos` stay pure I/O.

## Design

### 1. Capture usage at every model call site

`packages/ai/src/tool-use.ts` currently discards `response.usage`. Change `runToolUse` to return `{ data, usage }` where:

```ts
usage = {
  model: string;
  step: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  retries: number;       // counted inside runToolUse
  latencyMs: number;
}
```

Apply the same capture to the other Anthropic/OpenAI call sites:

- streaming spec — `packages/ai/src/steps/generate-spec/stream.ts` (usage is on `stream.finalMessage()`)
- SEARCH/REPLACE edits path in `packages/ai/src/steps/generate-file/` (the direct Anthropic call)
- OpenAI embeddings in `packages/repos` (`embed.ts` / `embedQuery`) — return token usage too

Grep the repo for `anthropic.messages` and the OpenAI client to confirm no call site is missed.

### 2. Cost calculation

A price table keyed by model (USD per 1M input/output tokens, current Anthropic + OpenAI prices, clearly commented as needing periodic update), co-located with `models.ts`, plus a pure helper `costUsd({ model, inputTokens, outputTokens, cachedInputTokens? })`. Unit-tested. Cached-token pricing handled if the field is present.

### 3. Data model — `LlmUsage`

New Prisma model in `packages/db/prisma/schema.prisma`:

```prisma
model LlmUsage {
  id                String   @id @default(cuid())
  featureId         String?
  feature           Feature? @relation(fields: [featureId], references: [id], onDelete: SetNull)
  projectId         String?
  userId            String?
  step              String
  model             String
  inputTokens       Int
  outputTokens      Int
  cachedInputTokens Int?
  costUsd           Decimal  @db.Decimal(10, 6)
  retries           Int      @default(0)
  latencyMs         Int
  createdAt         DateTime @default(now())
  @@index([projectId, createdAt])
  @@index([featureId, createdAt])
}
```

Thin repo function `recordLlmUsage` in `packages/db/src/repos/usage.ts` returning a domain type. Zod schema in `packages/domain/src/schemas/llm-usage.ts` (type via `z.infer`; one valid + two invalid tests).

Migration (from `packages/db`, per CLAUDE.md gotcha — invoke directly to avoid `--` mangling):

```sh
pnpm exec dotenv -e ../../.env -- prisma migrate dev --name add_llm_usage
```

### 4. Persist at the composing layer

In the question/spec/plan server actions, `lib/pr-runner.ts` (one row per file call in the codegen loop, attributed to `featureId`), and `app/api/spec/stream/route.ts`: take the returned `usage`, compute `costUsd`, call `recordLlmUsage` with `featureId` / `projectId` / `userId` in scope.

**Logging must never break the user flow** — wrap persistence so a failure is swallowed + `console.error`'d, not surfaced to the user.

## Alternative considered

Instead of changing `runToolUse`'s return type (touches every call site), pass an `onUsage` callback into it (dependency injection — `ai` stays decoupled, web provides the sink). Fewer call-site changes, slightly less explicit. Either is acceptable; default to the explicit return value given how few call sites there are. Let the implementer flag a preference in the plan.

## Out of scope

- PostHog / behavioral product events (funnels, retention, session replay) — separate PR.
- Dashboards / reporting over `LlmUsage` — raw ledger first; query it with SQL/Metabase later.

## Testing (per conventions §11 / §15)

- `costUsd` helper: unit tests across models + cached-token case.
- `LlmUsage` Zod schema: one valid, two invalid.
- Update `runToolUse` callers/tests for the new return shape.
- Integration: a feature run writes the expected usage rows, Anthropic client mocked at the SDK boundary.

## Done when

One PR. `pnpm typecheck && lint && test && test:integration` all green. PR description: "internal: per-call LLM usage + cost ledger". `architecture.md` updated with a short section on the `LlmUsage` ledger and the return-usage pattern.
