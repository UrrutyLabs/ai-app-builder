# Architecture — Spec-Driven Dev Tool (v0.1)

> The single source of truth for how this system is structured. Any code we write must conform to this document. If reality and this document disagree, we update one of them — never silently drift.

## 1. Product, in one sentence

A control plane for product → engineering translation: it transforms a vague idea into a structured **Feature Spec** and a deterministic **Implementation Plan**, with the human in the loop at every step.

It is **not** a code generator, an IDE, a Cursor competitor, or an autonomous agent. The value lives in narrowing requirements, making ambiguity explicit, and producing high-quality structured artifacts.

## 2. v0.1 scope

In scope:

1. Create a project.
2. Enter a vague feature idea.
3. AI generates clarifying questions.
4. User answers questions.
5. AI generates a structured `FeatureSpec`.
6. User edits and approves the spec.
7. AI generates an `ImplementationPlan`.
8. User exports spec + plan (JSON / Markdown download).

Explicitly out of scope for v0.1:

- Authentication / multi-user.
- GitHub or any VCS automation (no repo cloning, no PRs, no commits).
- Repo indexing or codebase awareness.
- Figma / design-tool integration.
- Autonomous agents, background jobs, or long-running workflows.
- Streaming token-by-token UI (LLM calls return complete validated objects).

## 3. Modes

The system supports two modes, persisted on the `Project`:

- `greenfield` — new project, no existing code constraints.
- `existing_system` — feature on an existing codebase.

For v0.1, both modes use the same pipeline. The mode value is passed into prompts so the LLM can adjust phrasing (e.g. ask about existing conventions in `existing_system`), but there is **no repo indexing yet**.

## 4. End-to-end flow

```
Dashboard
  └─ Project (mode: greenfield | existing_system)
       └─ Feature
            ├─ idea: string                       (user input)
            ├─ clarifyingQuestions: Question[]    (LLM step 1)
            ├─ answers: Answer[]                  (user input)
            ├─ spec: FeatureSpec                  (LLM step 2, draft → approved)
            └─ plan: ImplementationPlan           (LLM step 3, after spec approved)
```

State machine on `Feature.status`:

```
draft → questions_generated → answered → spec_drafted → spec_approved → plan_generated
```

Transitions are linear and one-way for v0.1. The user can re-run any step, which discards downstream artifacts (e.g. re-running spec generation invalidates the plan).

## 5. Monorepo layout

```
ai-app-builder/
├─ apps/
│   └─ web/                      # Next.js 15 App Router, the only deployable
├─ packages/
│   ├─ db/                       # Prisma schema, client, migrations
│   ├─ domain/                   # Zod schemas, domain types, errors, env validation
│   └─ ai/                       # LLM client, prompts, tool definitions, parsers
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
├─ ARCHITECTURE.md               # this file
└─ CONVENTIONS.md
```

Tooling: **pnpm workspaces + Turborepo**. Turbo pipelines: `build`, `lint`, `test`, `typecheck`.

## 6. Package boundaries

Each package has one responsibility and a one-way dependency arrow. Violating these is a code-review blocker.

### `packages/domain` — pure types, schemas, errors

- All Zod schemas (`FeatureSpec`, `ImplementationPlan`, `Question`, `Answer`, request/response payloads).
- TS types are **always** inferred from Zod via `z.infer`. Never hand-written alongside.
- Domain error classes (`AppError`, `ValidationError`, `LlmError`, `NotFoundError`, `ConflictError`).
- Env schema (`packages/domain/src/env.ts`) — validates `process.env` at boot.
- **No runtime dependencies on Next.js, Prisma, or the Anthropic SDK.** Pure TS only.

### `packages/db` — persistence

- Prisma schema and generated client.
- Migration scripts.
- Thin repository functions (e.g. `getFeatureById`, `updateFeatureStatus`) that return domain types from `packages/domain`.
- Owns nothing about HTTP, LLMs, or UI.
- Depends on: `packages/domain`.

### `packages/ai` — LLM orchestration

- Anthropic SDK wrapper.
- One file per LLM step under `src/steps/`: `generate-questions.ts`, `generate-spec.ts`, `generate-plan.ts`.
- Each step exports a single async function:
  ```ts
  export async function generateSpec(input: GenerateSpecInput): Promise<FeatureSpec>
  ```
- Prompts live colocated with their step under `src/steps/<step>/prompt.ts` as pure functions returning a string. No prompts inline in components or actions.
- Uses **Anthropic tool use** with Zod-derived JSON Schema for structured output (see §8).
- Model routing centralized in `src/models.ts` (Sonnet by default, Opus for plan).
- Depends on: `packages/domain`. Does **not** depend on `packages/db` or Next.js — it is pure I/O over the network.

### `apps/web` — UI + thin orchestration

- Next.js App Router, TypeScript, Tailwind, shadcn/ui.
- Pages are React Server Components (RSC). Client components are leaves marked `"use client"` only when needed (forms, dialogs, editors).
- Server Actions in `app/_actions/*.ts` for mutations. Each action: validates input with Zod → calls `packages/db` and/or `packages/ai` → revalidates path → returns typed result.
- Route Handlers in `app/api/.../route.ts` only when we need streaming or non-form clients (none in v0.1; reserved for future).
- Depends on: `packages/db`, `packages/domain`, `packages/ai`.

Dependency graph:

```
apps/web ──► packages/db ──► packages/domain
   │                              ▲
   └──────► packages/ai ──────────┘
```

`packages/db` and `packages/ai` may **not** import each other. The web app composes them.

### Database hosting (v0.1)

Postgres is hosted on **[Neon](https://neon.tech)**. No local Docker Postgres in v0.1 — Prisma talks to a Neon connection URL identically to any other Postgres. We use a **pooled** connection (`DATABASE_URL`) for the Next.js runtime and a **direct** connection (`DIRECT_URL`) for Prisma migrations, per [Prisma's Neon guidance](https://www.prisma.io/docs/orm/overview/databases/neon). Dev and test use separate Neon branches so test runs cannot stomp on dev data.

## 7. Data model (Prisma, v0.1)

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  mode        Mode     // enum: GREENFIELD | EXISTING_SYSTEM
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  features    Feature[]
}

model Feature {
  id            String        @id @default(cuid())
  projectId     String
  project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title         String
  idea          String        // raw user input
  status        FeatureStatus // enum
  questions     Json?         // Question[]   — see Zod schema
  answers       Json?         // Answer[]
  spec          Json?         // FeatureSpec
  plan          Json?         // ImplementationPlan
  approvedAt    DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum Mode             { GREENFIELD EXISTING_SYSTEM }
enum FeatureStatus    { DRAFT QUESTIONS_GENERATED ANSWERED SPEC_DRAFTED SPEC_APPROVED PLAN_GENERATED }
```

**Why JSON columns for spec/plan?** v0.1 treats them as opaque structured documents validated by Zod on read/write. We promote them to relational tables only if we need to query inside (e.g. "find all features with API changes"). Premature normalization is the enemy.

`FeatureSpec` and `ImplementationPlan` shapes are defined as Zod schemas in `packages/domain/src/schemas/`; the canonical `FeatureSpec` shape is the one in the brief.

### `ImplementationPlan` shape (v0.1)

```ts
type AffectedArea = "frontend" | "backend" | "database" | "infrastructure" | "docs" | "tests";

type ImplementationPlan = {
  summary: string;                       // TL;DR tying back to the spec
  affectedAreas: AffectedArea[];         // ≥1, top-level overview
  fileChanges: Array<{                   // can be empty
    path: string;
    action: "create" | "modify" | "delete";
    summary: string;                     // one-line what/why
  }>;
  steps: Array<{                         // ≥1, ordered by array position
    title: string;
    description: string;
    area: AffectedArea;                  // for grouping in the UI
  }>;
  testPlan: string[];                    // ≥1 items
  risks: Array<{                         // ≥1 — the LLM must always surface at least one
    description: string;
    mitigation: string;
  }>;
};
```

Design notes:
- Step order is implicit (array position) — no explicit `order` field, no renumbering pain on insert.
- `step.area` lets the UI render steps grouped by layer, in addition to the top-level `affectedAreas` summary.
- `risks` is required ≥1 to force the LLM to think about edge cases / failure modes rather than skipping.
- `fileChanges` may be empty (e.g. pure-doc changes, infra-only tweaks) so we don't fight the LLM into faking entries.

## 8. LLM integration

**Provider:** Anthropic only. SDK: `@anthropic-ai/sdk`. Models routed via `packages/ai/src/models.ts`:

```ts
import { env } from "@repo/domain/env";

export const MODELS = {
  questions: env.AI_MODEL_QUESTIONS ?? "claude-haiku-4-5-20251001",
  spec:      env.AI_MODEL_SPEC      ?? "claude-sonnet-4-6",
  plan:      env.AI_MODEL_PLAN      ?? "claude-opus-4-7",
} as const;
```

Defaults pick the cheapest model that does the job: Haiku for clarifying questions (cheap, plenty smart for short Q-generation), Sonnet for the spec, Opus for the implementation plan. Override per env var (`AI_MODEL_QUESTIONS`, `AI_MODEL_SPEC`, `AI_MODEL_PLAN`) for local experimentation.

**Structured output via tool use.** For every step that produces a structured object:

1. Define the output Zod schema in `packages/domain`.
2. Convert it to JSON Schema with `zod-to-json-schema` at module load.
3. Pass it as a tool to the Anthropic API with `tool_choice: { type: "tool", name: "..." }`.
4. Parse the tool input through the same Zod schema before returning. Any parse failure → throw `LlmError` with the raw payload attached.

Retry policy: one retry on `LlmError` for spec/plan generation. No retry for questions (cheap to ask the user to rerun).

**Determinism knobs.** `temperature: 0.2` for spec/plan, `0.5` for clarifying questions. `max_tokens` set per step. No streaming in v0.1.

**No prompts in UI code.** Every prompt is a pure function in `packages/ai/src/steps/<step>/prompt.ts`, unit-tested for stability against fixture inputs.

## 9. Request flow per step

### Step 1 — Idea → Questions

```
[Client form: textarea]
   └─ Server Action `generateQuestions(featureId, idea)`
        ├─ Zod-validate input
        ├─ db.updateFeature({ idea, status: DRAFT })
        ├─ ai.generateQuestions({ idea, mode })   ── Anthropic call
        ├─ Zod-validate output (Question[])
        ├─ db.updateFeature({ questions, status: QUESTIONS_GENERATED })
        └─ revalidatePath(`/projects/${id}/features/${featureId}`)
```

### Step 2 — Answers → Spec (draft)

Same shape: action validates `Answer[]`, calls `ai.generateSpec`, persists draft, revalidates. Status → `SPEC_DRAFTED`.

### Step 2b — Edit and approve spec

User edits the draft in a `react-hook-form` editor with Zod resolver (the same Zod schema). Approval is a server action that sets `approvedAt` and `status = SPEC_APPROVED`. No LLM call.

### Step 3 — Approved Spec → Plan

`ai.generatePlan` (Opus) takes the approved spec and returns an `ImplementationPlan`. Persisted, status → `PLAN_GENERATED`.

### Step 4 — Export

Server Action returns `{ spec, plan }` as JSON; client triggers a download. A second action returns the same content rendered as Markdown. No LLM call.

## 10. Error handling at boundaries

- Inside packages: throw typed errors (`AppError` subclasses).
- At the Server Action boundary: catch, log, return a discriminated union:
  ```ts
  type ActionResult<T> =
    | { ok: true;  data: T }
    | { ok: false; error: { code: string; message: string } };
  ```
- The client renders `error.message` in a toast and never trusts unsanitized error fields.
- Unknown errors are logged with full stack server-side and surfaced as `{ code: "INTERNAL", message: "Something went wrong" }`.

## 11. What we'll add later (explicitly deferred)

- Auth + multi-tenancy (clean migration: add `User`, scope `Project.userId`).
- Streaming UI for spec generation.
- Repo indexing for `existing_system` mode (vector store + retrieval into prompts).
- GitHub PR creation from `ImplementationPlan`.
- Versioning and diffing of specs.

These are intentionally out of v0.1. Do not pre-build hooks for them.
