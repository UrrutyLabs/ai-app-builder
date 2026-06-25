# Architecture — Spec-Driven Dev Tool

> The single source of truth for how this system is structured. Any code we write must conform to this document. If reality and this document disagree, we update one of them — never silently drift.
>
> **Reconciled against the codebase on 2026-06-23.** This document originally described an export-only "v0.1." The system has since shipped auth + multi-tenancy, GitHub repo grounding, code generation, PR creation, streaming spec generation, **meeting-transcript ingestion**, and **project context documents**. The text below reflects what is actually built. The forward plan lives in `roadmap.md`; the product north star lives in `Vision.md`.

## 1. Product, in one sentence

A control plane for product → engineering translation: it transforms a vague idea into a structured **Feature Spec**, a deterministic **Implementation Plan**, and — when the user asks for it — **real code on a pull-request branch**, with the human in the loop at every step.

It is **not** an IDE, a Cursor competitor, or an autonomous agent. Code generation exists as a utility the pipeline consumes: the output is always a reviewable PR a human approves, never an autonomous merge. The value lives in narrowing requirements, making ambiguity explicit, grounding everything in the real codebase, and producing high-quality structured artifacts.

## 2. Current capabilities

Shipped and in the repo today:

1. Create a project (`greenfield` or `existing_system`), scoped to the signed-in user.
2. Connect a GitHub repo to a project: fetch the file tree, infer conventions, embed files into a vector index.
3. Attach **context documents** (PRD, domain model, notes) to a project: paste or upload `.md`/`.txt`, chunked and embedded into a vector index alongside the repo.
4. Start a feature two ways: type a vague idea, **or paste a refinement-meeting transcript** that the AI distills into a title, idea, and supporting context (decisions / constraints / open questions) for human review.
5. AI generates clarifying questions, grounded in the connected repo, attached docs, and any transcript context.
6. User answers questions.
7. AI generates a structured `FeatureSpec` (streamed as it materializes), grounded in the same sources.
8. User edits and approves the spec. Every save is versioned; a diff view shows what changed between versions.
9. AI generates an `ImplementationPlan` (steps grouped by area, file changes, test plan, risks).
10. Export spec + plan as JSON or Markdown.
11. Create a pull request in one of three modes: **doc-only** (writes spec/plan markdown), **stubs** (scaffolds the files from `plan.fileChanges`), or **generate** (writes real implementations via the codegen loop). PR status syncs back onto the feature page.

Authentication (Neon Auth) and multi-tenancy (`Project.userId` scoping) are live.

Still deferred (see `roadmap.md` for sequencing): per-section spec comments, real-time multiplayer editing, outcome/drift tracking, multi-LLM provider abstraction, org-level prompt customization, Figma/Notion ingestion, feature-scoped context docs, and binary (PDF/DOCX) document ingestion.

## 3. Modes

Two modes, persisted on the `Project`:

- `greenfield` — new project, no existing code constraints.
- `existing_system` — feature on an existing codebase.

The mode is passed into prompts so the LLM adjusts phrasing. In `existing_system` mode with a connected repo, the difference is now substantive, not cosmetic: clarifying questions, spec generation, and code generation all retrieve relevant file snippets and inferred conventions from the repo index (see §10). Project context documents are retrieved the same way and apply in both modes — greenfield projects benefit from attached PRDs / domain models even without a repo.

## 4. End-to-end flow

```
Dashboard
  └─ Project (mode, userId, optional Repo)
       └─ Repo (file tree, inferred conventions, file embeddings)        [optional]
       └─ ProjectContextDoc[] (PRD / domain / notes, chunked + embedded)  [optional]
       └─ Feature
            ├─ idea: string                       (user input, OR distilled from a transcript)
            ├─ transcript, transcriptContext      (optional; decisions/constraints/openQuestions)
            ├─ questions: Question[]              (LLM step 1, grounded in repo + docs + transcript)
            ├─ answers: Answer[]                  (user input)
            ├─ spec: FeatureSpec                  (LLM step 2, streamed; draft → approved)
            │    └─ SpecVersion[]                 (one per save, with diff view)
            ├─ plan: ImplementationPlan           (LLM step 3, after spec approved)
            └─ pull request                       (doc-only | stubs | generate)
                 └─ prUrl, prCreatedAt persisted on Feature
```

A feature can be seeded either from a typed idea or from a pasted refinement transcript; the transcript path runs an extra `extract-from-transcript` LLM step first, then lands in the same pipeline. Project context documents and the connected repo are both retrieved into the question/spec/transcript-extraction prompts via a single unified retrieval helper (`retrieveProjectContext`).

State machine on `Feature.status`:

```
DRAFT → QUESTIONS_GENERATED → ANSWERED → SPEC_DRAFTED → SPEC_APPROVED → PLAN_GENERATED
```

PR creation is an action available once a plan exists; it does not add a status value — it records `prUrl` / `prCreatedAt` on the `Feature`. Re-running a step discards downstream artifacts (re-running spec generation invalidates the plan), enforced in the repo functions, not the UI.

## 5. Monorepo layout

```
ai-app-builder/
├─ apps/
│   └─ web/                      # Next.js 16 App Router, the only deployable
├─ packages/
│   ├─ domain/                   # Zod schemas, domain types, errors, env validation
│   ├─ db/                       # Prisma schema, client, repository functions
│   ├─ ai/                       # LLM client, prompts, tool definitions, parsers, codegen
│   ├─ repos/                    # GitHub access, repo indexing, embeddings, PR creation, encryption
│   ├─ ui/                       # shared React component primitives
│   ├─ eslint-config/            # shared ESLint config
│   └─ typescript-config/        # shared tsconfig bases
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
├─ docs/                         # architecture.md, conventions.md, roadmap.md, …
└─ CLAUDE.md
```

Tooling: **pnpm workspaces + Turborepo**. Turbo pipelines: `build`, `lint`, `test`, `typecheck`.

## 6. Package boundaries

Each package has one responsibility and a mostly one-way dependency arrow. Violating these is a code-review blocker.

### `packages/domain` — pure types, schemas, errors

- All Zod schemas (`FeatureSpec`, `ImplementationPlan`, `Question`, `Answer`, `Repo`/`FileTree`, `ConnectRepoInput`, request/response payloads).
- TS types are **always** inferred from Zod via `z.infer`. Never hand-written alongside.
- Domain error classes (`AppError`, `ValidationError`, `LlmError`, `NotFoundError`, `ConflictError`).
- Env schema (`packages/domain/src/env-schema.ts` + `env.ts`) — validates `process.env`.
- **No runtime dependencies on Next.js, Prisma, or the Anthropic SDK.** Pure TS only.

### `packages/db` — persistence

- Prisma schema (Postgres + `pgvector`) and generated client.
- Thin repository functions per aggregate under `src/repos/`: `projects.ts`, `features.ts`, `repos.ts`, `embeddings.ts`, `spec-versions.ts`. They return domain types from `packages/domain`.
- Owns nothing about HTTP, LLMs, or UI.
- Depends on: `packages/domain`.

### `packages/ai` — LLM orchestration & code generation

- Anthropic SDK wrapper (`client.ts`, `tool-use.ts`).
- One directory per step under `src/steps/`: `generate-questions`, `generate-spec` (+ `stream.ts`), `generate-plan`, `generate-file` (code generation), `check-consistency` (cross-file pass).
- Each step exports a single async function returning a validated, typed object; prompts are sibling pure functions in `<step>/prompt.ts`. No prompts inline in components or actions.
- Structured output via **Anthropic tool use** with Zod-derived JSON Schema (see §9).
- Model routing centralized in `src/models.ts`.
- Depends on: `packages/domain`. Does **not** depend on `packages/db`, `packages/repos`, or Next.js — it is pure I/O over the network. Repo context is passed *in* as plain data by the caller.

### `packages/repos` — GitHub access, indexing, PRs

- GitHub API access (`github.ts`, `fetch-tree.ts`, `fetch-files.ts`, `pull-request.ts`).
- Repo indexing: file embedding (`embed.ts`, `index-files.ts`) and convention inference (`infer-conventions.ts`, `summarize-conventions.ts`).
- Retrieval helpers (`render-snippets.ts`) and token encryption at rest (`encryption.ts`).
- Split entrypoints: `index.ts` (safe for any context) vs. `server.ts` / `secure.ts` (server-only: embedding calls, decryption). Import `@repo/repos/server` only from server code.
- Depends on: `packages/domain`.

### `apps/web` — UI + thin orchestration

- Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui.
- Pages are React Server Components (RSC). Client components are leaves marked `"use client"` only when needed (forms, dialogs, editors).
- Server Actions in `app/_actions/*.ts` for mutations: `projects`, `features`, `questions`, `answers`, `spec`, `plan`, `export`, `repo`. Each action validates input with Zod → calls packages → revalidates path → returns `ActionResult<T>`.
- Route Handlers in `app/api/.../route.ts` for the cases Server Actions can't serve: `auth/[...path]` (Neon Auth), `spec/stream` (SSE streaming spec generation), `pr/create` (long-running PR build with progress events).
- `middleware.ts` enforces auth; `lib/auth/*` wraps session access (`requireUser`).
- Depends on: `packages/db`, `packages/domain`, `packages/ai`, `packages/repos`, `packages/ui`.

Dependency graph:

```
apps/web ──► packages/db    ──► packages/domain
   │      ──► packages/ai    ──► packages/domain
   │      ──► packages/repos ──► packages/domain
   │      ──► packages/ui
```

`db`, `ai`, and `repos` may **not** import each other. The web app composes them (e.g. `pr-runner` pulls repo context from `@repo/db` + `@repo/repos` and passes it as data into `@repo/ai`).

### Database hosting

Postgres is hosted on **[Neon](https://neon.tech)** with the `vector` (pgvector) extension enabled for embeddings. No local Docker Postgres. We use a **pooled** connection (`DATABASE_URL`) for the Next.js runtime and a **direct** connection (`DIRECT_URL`) for Prisma migrations. Dev and test use separate Neon branches (`TEST_DATABASE_URL` / `TEST_DIRECT_URL`) so test runs cannot stomp on dev data. Neon Auth syncs users into `neon_auth.users_sync`, which `Project.userId` references.

## 7. Data model (Prisma)

```prisma
model Project {
  id          String    @id @default(cuid())
  userId      String?                  // Neon Auth user; nullable for legacy/orphan claim
  name        String
  mode        Mode
  description String?
  specPath    String?                  // last-used PR path for spec docs
  planPath    String?                  // last-used PR path for plan docs
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  features    Feature[]
  repo        Repo?
  contextDocs ProjectContextDoc[]
  @@index([userId])
}

model Repo {
  id             String              @id @default(cuid())
  projectId      String              @unique
  project        Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner          String
  repo           String
  defaultBranch  String
  encryptedToken String               // GitHub token, encrypted at rest (@repo/repos)
  fileTree       Json?
  conventions    Json?                // inferred lint/format/test stack + patterns
  lastIndexedAt  DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  embeddings     RepoFileEmbedding[]
}

model RepoFileEmbedding {
  id        String                       @id @default(cuid())
  repoId    String
  repo      Repo                         @relation(fields: [repoId], references: [id], onDelete: Cascade)
  path      String
  content   String
  embedding Unsupported("vector(1536)")  // pgvector
  updatedAt DateTime                     @default(now())
  @@unique([repoId, path])
  @@index([repoId])
}

model Feature {
  id                String        @id @default(cuid())
  projectId         String
  project           Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title             String
  idea              String
  status            FeatureStatus @default(DRAFT)
  questions         Json?         // Question[]
  answers           Json?         // Answer[]
  spec              Json?         // FeatureSpec
  plan              Json?         // ImplementationPlan
  approvedAt        DateTime?
  prUrl             String?
  prCreatedAt       DateTime?
  transcript        String?       // raw pasted refinement transcript (optional)
  transcriptContext Json?         // TranscriptContext: decisions/constraints/openQuestions
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  specVersions      SpecVersion[]
}

model SpecVersion {
  id        String   @id @default(cuid())
  featureId String
  feature   Feature  @relation(fields: [featureId], references: [id], onDelete: Cascade)
  spec      Json
  createdAt DateTime @default(now())
  @@index([featureId, createdAt])
}

model ProjectContextDoc {
  id         String                       @id @default(cuid())
  projectId  String
  project    Project                      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title      String
  content    String                       // full text, kept for re-embedding
  mimeType   String                       // "text/markdown" | "text/plain" (v1)
  byteLength Int
  createdAt  DateTime                     @default(now())
  updatedAt  DateTime                     @updatedAt
  embeddings ProjectContextDocEmbedding[]
  @@index([projectId])
}

model ProjectContextDocEmbedding {
  id        String                      @id @default(cuid())
  docId     String
  doc       ProjectContextDoc           @relation(fields: [docId], references: [id], onDelete: Cascade)
  chunkIx   Int
  content   String                      // the chunk's text (injected into prompts)
  embedding Unsupported("vector(1536)") // pgvector
  updatedAt DateTime                    @default(now())
  @@unique([docId, chunkIx])
  @@index([docId])
}

enum Mode          { GREENFIELD EXISTING_SYSTEM }
enum FeatureStatus { DRAFT QUESTIONS_GENERATED ANSWERED SPEC_DRAFTED SPEC_APPROVED PLAN_GENERATED }
```

**Why JSON columns for `questions` / `answers` / `spec` / `plan`?** They are opaque structured documents validated by their Zod schema on read and write. We promote them to relational tables only when a query needs to reach inside (e.g. "find all features with API changes"). Premature normalization is the enemy. To clear a JSON column use `Prisma.DbNull`, not bare `null`.

`FeatureSpec` and `ImplementationPlan` shapes are Zod schemas in `packages/domain/src/schemas/`.

### `FeatureSpec` shape

```ts
type FeatureSpec = {
  title: string;
  problem: string;
  goal: string;
  mode: "greenfield" | "existing_system";
  scope: { in: string[]; out: string[] };
  actors: string[];
  userFlows: string[];
  uiStates: string[];
  businessRules: string[];
  dataChanges: string[];
  apiChanges: string[];
  acceptanceCriteria: string[];
  assumptions: string[];
  openQuestions: string[];
};
```

### `ImplementationPlan` shape

```ts
type AffectedArea = "frontend" | "backend" | "database" | "infrastructure" | "docs" | "tests";

type ImplementationPlan = {
  summary: string;                       // TL;DR tying back to the spec
  affectedAreas: AffectedArea[];         // ≥1
  fileChanges: Array<{                   // can be empty; content is NOT here — codegen produces it
    path: string;
    action: "create" | "modify" | "delete";
    summary: string;
  }>;
  steps: Array<{ title: string; description: string; area: AffectedArea }>;  // ≥1, ordered by position
  testPlan: string[];                    // ≥1
  risks: Array<{ description: string; mitigation: string }>;                 // ≥1, forces edge-case thinking
};
```

Step order is implicit (array position). `risks` is required ≥1 so the LLM surfaces failure modes. `fileChanges` may be empty (pure-doc or infra-only changes); the plan describes *what* changes, while code generation (§11) produces the actual file *content*.

## 8. Authentication & multi-tenancy

- **Neon Auth** (powered by Stack Auth). The auth UI mounts at `app/auth/[...path]`; the handler at `app/api/auth/[...path]/route.ts`. `middleware.ts` gates protected routes.
- Users sync into `neon_auth.users_sync` in the same Postgres, so `Project.userId` is a plain foreign key — no webhook sync layer.
- `lib/auth/server.ts` exposes `requireUser()`; every Server Action that touches user data resolves the user and scopes queries (`getProjectByIdForUser`, etc.).
- `Project.userId` is nullable to support **orphan claiming**: projects created before auth can be claimed by the first signed-in user (`claim-orphans-banner`).

## 9. LLM integration

**Provider:** Anthropic for generation; OpenAI for embeddings. SDK: `@anthropic-ai/sdk`. Models routed via `packages/ai/src/models.ts`:

```ts
export const MODELS = {
  questions: env.AI_MODEL_QUESTIONS ?? "claude-haiku-4-5-20251001", // cheap, fine for short Q-gen
  spec:      env.AI_MODEL_SPEC      ?? "claude-sonnet-4-6",
  plan:      env.AI_MODEL_PLAN      ?? "claude-opus-4-7",
  code:      env.AI_MODEL_CODE      ?? "claude-sonnet-4-6",         // file generation
} as const;
```

Override per env var for local experimentation. **`temperature` is omitted for the plan step** because it's deprecated on Opus 4.7 (`tool-use.ts` makes it optional); Sonnet and Haiku steps still set it.

**Structured output via tool use.** For every step that produces a structured object:

1. Define the output Zod schema (in `packages/domain` for shared shapes, or locally in the step for internal ones like the codegen `{ content }` envelope).
2. Convert it to JSON Schema with `zod-to-json-schema`.
3. Pass it as a tool to the Anthropic API with `tool_choice: { type: "tool", name: "..." }`.
4. Parse the tool input through the same Zod schema before returning. Any parse failure → throw `LlmError` with the raw payload attached.

**Streaming.** Spec generation has a streaming variant (`generate-spec/stream.ts`, surfaced via the `spec/stream` SSE route) so the user watches the spec materialize instead of waiting on a spinner. Other steps return complete validated objects.

**Embeddings.** Repo files are embedded with OpenAI (`vector(1536)`) and stored in `RepoFileEmbedding` for retrieval (§10).

**Determinism knobs.** Low temperature (≈0.2) for spec/plan/code, higher (≈0.5) for clarifying questions. `max_tokens` and retry policy are constants at the top of each step file.

**No prompts in UI code.** Every prompt is a pure function in `packages/ai/src/steps/<step>/prompt.ts`, snapshot-tested for stability.

## 10. Grounding & retrieval

The system grounds generation in three kinds of context: the connected repo, attached project documents, and (per feature) a refinement transcript.

**Repo.** When a repo is connected (`existing_system`), `connectRepoAction`:

1. Parses the GitHub URL, stores the repo with its token **encrypted at rest** (`@repo/repos` encryption, `ENCRYPTION_KEY`).
2. Fetches the file tree and **infers conventions** (lint/format, test stack, common patterns) into `Repo.conventions`.
3. **Embeds** repo files (`fetchAndEmbedRepoFiles`) into `RepoFileEmbedding`.

**Context documents.** `uploadContextDocAction` stores a pasted/uploaded `.md`/`.txt` doc on `ProjectContextDoc`, then chunks it (`embedDocContent`, ~1500-char overlapping chunks, capped at `MAX_CHUNKS_PER_DOC`) and embeds each chunk into `ProjectContextDocEmbedding`. Embedding failure does not fail the upload (the doc is stored, just not yet retrievable) — same tolerance as repo connect. Available in both modes; greenfield projects use docs even without a repo.

**Unified retrieval.** At generation time, `retrieveProjectContext` (in `apps/web/src/lib/context-retrieval.ts`) embeds the query once and searches repo files (`searchSimilarFiles`, top-8) and context-doc chunks (`searchSimilarContextDocs`, top-4) in parallel, returning two distinct rendered blocks: `codeContext` (ground truth) and `docsContext` (framed as "may be stale"). Both — plus a convention summary and any transcript context — are rendered into the prompts for questions, spec, and transcript extraction. Keeping code and docs separate lets prompts weight them differently. This grounding is what distinguishes the product from "ChatGPT with a nice form."

**Transcript ingestion.** A feature can be seeded from a pasted refinement transcript instead of a typed idea. `extractFromTranscriptAction` runs the `extract-from-transcript` LLM step (Sonnet, tool-use, grounded in repo + docs) to distill a `title`, `idea`, and `TranscriptContext` (settled decisions / constraints / open questions). The raw transcript and extracted context are persisted on the `Feature`; the user reviews the extraction before the pipeline advances (never auto-advanced). Downstream steps feed the transcript context into their prompts: decisions are treated as settled, open questions seed the clarifying questions.

## 11. Code generation & pull requests

PR creation runs through `app/api/pr/create/route.ts` → `lib/pr-runner.ts`, emitting progress events (`pr-events.ts`) consumed by a streaming progress UI. The input `fileMode` selects one of three strategies:

- **`none` (doc-only):** writes `<specPath>` and `<planPath>` markdown to a feature branch and opens a PR with the plan as the body. Lowest risk; usable by any team.
- **`stubs`:** scaffolds the files from `plan.fileChanges` with stub bodies (`scaffold-stubs.ts`), each plan step becoming a checkbox in the PR.
- **`generate`:** produces real implementations. For each file change, `generateFile` (`@repo/ai`) writes content grounded in retrieved repo snippets, then **verifies** it:
  - syntax check (`verify.ts`) and **typecheck loop** (`typecheck.ts`) with up to one repair attempt;
  - large `modify` targets (> ~6000 chars) use **SEARCH/REPLACE edits** (`edits.ts` / `apply-edits.ts`) to bound LLM output to the size of the change, not the file;
  - a **cross-file consistency pass** (`check-consistency`) flags mismatches across the generated set.

The branch is pushed and a PR opened via `@repo/repos` (`pull-request.ts`); `prUrl` / `prCreatedAt` are written back to the `Feature` and shown inline (`pr-status-badge`). When the PR later merges, the diff-vs-plan signal is captured to inform future plan generation.

## 12. Error handling at boundaries

- Inside packages: throw typed errors (`AppError` subclasses).
- At the Server Action / Route Handler boundary: catch, log, return a discriminated union:
  ```ts
  type ActionResult<T> =
    | { ok: true;  data: T }
    | { ok: false; error: { code: string; message: string } };
  ```
- The client renders `error.message` in a toast and never trusts unsanitized error fields.
- Unknown errors are logged with full stack server-side and surfaced as `{ code: "INTERNAL", message: "Something went wrong" }`.

## 13. What we'll add later (explicitly deferred)

Tracked in `roadmap.md`. Not built yet:

- **Tickets out (projection)** — render + sync an approved spec to Linear/Jira; a ticket is an emitted view, not the source of truth.
- **Provenance / lineage** — record the source of each artifact field as a first-class `Decision`, the first step toward the `Initiative → Decision → Feature → Change` spine. Context docs and transcripts already give every retrievable chunk a stable `(sourceType, sourceId)`, which is the seam this builds on. See [`decisions/0001-decisions-not-tickets.md`](decisions/0001-decisions-not-tickets.md).
- **Collaboration** — per-section spec comments; real-time multiplayer editing.
- **Outcome tracking** — cycle-time metrics, spec-drift detection, plan-accuracy feedback.
- **Enterprise** — multi-LLM provider abstraction, org-level prompt customization, custom `FeatureSpec` fields.
- **Richer context sources** — binary (PDF/DOCX) document ingestion, feature-scoped context docs, Figma design intent, Notion ingestion. Today's `ProjectContextDoc` is the concrete pattern these will generalize from.

Do not pre-build hooks for these. The data-model spine is now decided ([`decisions/0001-decisions-not-tickets.md`](decisions/0001-decisions-not-tickets.md)): evolve `Project → Feature` toward **`Initiative → Decision → Feature → Change`**, where a `Decision` is a first-class provenanced node and a ticket is an emitted projection — not an internal entity. The `Decision` entity is the Phase 2 seam; see `roadmap.md`.
