# Feature brief — Project context documents

> Status: **✅ shipped (2026-06-23).** This brief is kept as the design record. The feature is live; see `architecture.md` §10 (Grounding & retrieval) for how it works in the codebase and `roadmap.md` Foundation for status. The generalized `ContextSource` abstraction described as the eventual direction remains deferred (Phase 5) — `ProjectContextDoc` is the concrete pattern it will build on.

## Goal

Let a user attach **documents** (PRD, domain model, internal notes) to a project so that every feature in the project — clarifying questions, spec, plan — is grounded in that ambient context, alongside the connected repo and the per-feature transcript.

Today the only project-level grounding is a connected GitHub repo. This adds a second kind of grounding source at the same scope. Feature-scope attachments are deferred to v2 (same machinery, different parent FK).

## Why

The roadmap's wedge is "rawest, most valuable context, no good competitor." Repos are one source; refinement transcripts another. PRDs, domain models, and internal docs are where PMs and tech leads already write down the things engineers most often miss — exactly the gap better grounding closes. This is also the smallest concrete step toward a generalized `ContextSource` abstraction without paying for that abstraction up front.

## Scope (smallest version that fits)

In scope (v1):

1. A new model `ProjectContextDoc` with a paired `ProjectContextDocEmbedding`, mirroring the existing `Repo` + `RepoFileEmbedding` shape.
2. **Plain-text and Markdown only** (`.md`, `.txt`). No binary parsing in v1.
3. Paste-or-upload UI on the project page: title + content. Upload reads file content client-side and submits as text.
4. Server-side chunking + OpenAI embedding (reuse existing `embedQuery` / chunking pattern from `@repo/repos/server`).
5. Retrieval helper that searches both `RepoFileEmbedding` (when a repo is connected) and `ProjectContextDocEmbedding` for a given project, returning a unified `top-K`.
6. Pass the merged retrieval into existing `generateQuestions` / `generateSpec` / `extractFromTranscript` prompts under a new `docsContext` block (so it's distinguishable from `codeContext`).
7. List + delete on the project page (no edit-in-place v1; delete + re-upload is fine).

Explicitly deferred (do **not** pre-build):
- PDF, DOCX, or other binary formats. (First follow-up.)
- Feature-scope attachments. (Same machinery, different FK — v2.)
- Per-doc edit UI. (Delete + re-upload is enough for now.)
- Provenance ("this assumption came from doc X"). (Roadmap Phase 2; this brief sets up the data model so provenance can be added without re-platforming.)
- Notion / Figma connectors. (Different design; not this brief.)
- Versioning of context docs. (Re-upload creates a new doc; we keep things simple.)
- Auto-summarization of long docs into a header context block. (Wait for evidence top-K retrieval isn't enough.)

## Design

### 1. Schema — `packages/db/prisma/schema.prisma`

Additive, no FK changes to existing models:

```prisma
model ProjectContextDoc {
  id          String                       @id @default(cuid())
  projectId   String
  project     Project                      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  content     String                       // full text, kept for re-embedding
  mimeType    String                       // "text/markdown" or "text/plain" in v1
  byteLength  Int
  createdAt   DateTime                     @default(now())
  updatedAt   DateTime                     @updatedAt
  embeddings  ProjectContextDocEmbedding[]

  @@index([projectId])
}

model ProjectContextDocEmbedding {
  id        String                       @id @default(cuid())
  docId     String
  doc       ProjectContextDoc            @relation(fields: [docId], references: [id], onDelete: Cascade)
  chunkIx   Int
  content   String                       // the chunk's text (for the prompt)
  embedding Unsupported("vector(1536)")
  updatedAt DateTime                     @default(now())

  @@unique([docId, chunkIx])
  @@index([docId])
}
```

Add the back-relation on `Project`: `contextDocs ProjectContextDoc[]`.

Migration: `add_project_context_docs`. Additive only, no backfill.

### 2. DB repo — `packages/db/src/repos/context-docs.ts`

```ts
createContextDoc({ projectId, title, content, mimeType }): Promise<ProjectContextDocRecord>
listContextDocsByProjectId(projectId): Promise<ProjectContextDocRecord[]>
getContextDocById(id): Promise<ProjectContextDocRecord | null>
deleteContextDoc(id): Promise<void>
replaceContextDocEmbeddings(docId, items): Promise<number>
searchSimilarContextDocs(projectId, queryEmbedding, k): Promise<SimilarDocChunk[]>
```

`searchSimilarContextDocs` is a raw `pgvector` query joining `ProjectContextDocEmbedding` → `ProjectContextDoc` filtered by `projectId`, ordered by cosine distance, limited to `k`. Returns `{ docTitle, chunkContent, similarity }`. Same pattern as the existing `searchSimilarFiles`.

### 3. Chunking + embedding — `packages/repos/src/server/embed-doc.ts`

New module beside the existing embed-files code. One exported function:

```ts
embedDocContent({ content, mimeType }): Promise<Array<{ chunkIx: number; content: string; embedding: number[] }>>
```

Chunking rules (v1, deliberately dumb): split by paragraph; pack paragraphs into ~1500-character chunks, target ~10% overlap. Reuse `embedQuery` (or a `embedBatch` if it already exists) for the OpenAI call. Bounded by `MAX_CHUNKS_PER_DOC = 100` — log + truncate if a doc exceeds it (per the no-silent-caps rule).

### 4. Unified retrieval — `apps/web/src/lib/context-retrieval.ts`

One helper, called from every place that today does `searchSimilarFiles(repo.id, …)`:

```ts
async function retrieveProjectContext({
  projectId,
  query,
  kFiles?,        // default 8 (today's TOP_K)
  kDocs?,         // default 4
}): Promise<{
  codeSnippets: CodeSnippet[];     // from RepoFileEmbedding (empty if no repo)
  docSnippets: DocSnippet[];       // from ProjectContextDocEmbedding (empty if no docs)
}>;
```

Internally: embed the query once, run both pgvector searches in parallel, return both lists. Renderers `renderSnippets` (existing) and a new `renderDocSnippets` produce the prompt blocks.

### 5. Prompt feed-forward

Add an optional `docsContext: string | null` to:
- `GenerateQuestionsInput` (`packages/ai/src/steps/generate-questions/prompt.ts`)
- `GenerateSpecInput` (`packages/ai/src/steps/generate-spec/prompt.ts`)
- `ExtractFromTranscriptInput` (`packages/ai/src/steps/extract-from-transcript/prompt.ts`)

Insert a new prompt block: `"Project documents (PRD / domain model / notes):\n${docsContext}"`. Mirror the existing `codeBlock` / `transcriptBlock` pattern. **Keep `codeContext` and `docsContext` separate** — they have different reliability characteristics (code is ground truth; docs may be stale) and prompts may want to weight them differently later.

Wire-up callers:
- `apps/web/src/app/_actions/questions.ts`
- `apps/web/src/app/_actions/spec.ts`
- `apps/web/src/app/api/spec/stream/route.ts`
- `apps/web/src/app/_actions/transcript.ts`

Each replaces its current ad-hoc `searchSimilarFiles` block with the unified `retrieveProjectContext` helper, then passes both rendered blocks into the step input.

### 6. Server Actions — `apps/web/src/app/_actions/context-docs.ts`

```ts
uploadContextDocAction({ projectId, title, content, mimeType }): ActionResult<ProjectContextDocRecord>
deleteContextDocAction({ docId }): ActionResult<{ docId: string }>
```

Both gated by `requireUser()` + `getProjectByIdForUser()` (scope check via `projectId` on the doc for delete). Input schema in `@repo/domain`:

```ts
UploadContextDocInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(500_000),   // ~500 KB text
  mimeType: z.enum(["text/markdown", "text/plain"]),
})
```

`uploadContextDocAction`:
1. Validate input, verify project ownership.
2. `createContextDoc(...)` — stores the doc row.
3. `embedDocContent(...)` — chunk + embed.
4. `replaceContextDocEmbeddings(...)` — write embeddings.
5. `revalidatePath` the project page.

Embedding failure does **not** fail the upload — mirror the existing `connectRepoAction` pattern (doc is usable without retrieval; we just log and continue).

### 7. UI

New section on the project page (`apps/web/src/app/projects/[projectId]/page.tsx`), under "Repo":

- Heading: **Context documents**.
- One-line description.
- List of attached docs (title, byte size, created date, delete button).
- "Add document" form: title input + file input (`.md`, `.txt`) **or** paste-into-textarea. The file input reads via `FileReader` client-side; we submit `content` as plain text regardless of source.

Components:
- `apps/web/src/components/project/context-docs-section.tsx` (server component listing docs)
- `apps/web/src/components/project/add-context-doc-form.tsx` (client; react-hook-form + Zod)
- `apps/web/src/components/project/delete-context-doc-button.tsx` (client; calls delete action)

Greenfield projects (no repo connector) still see this section — that's part of the value, since they're the projects that need ambient context most.

## Risks

- **Long docs exceed token windows** when many chunks survive top-K. Mitigation: `kDocs = 4` default (smaller than `kFiles = 8`), per-chunk cap at ~1500 chars. Total docsContext block bounded at ~6 KB.
- **Hallucinated grounding** — a chunk lifted out of context can mislead the LLM. Mitigation: prompt explicitly labels the block as "may be stale" so the model treats it as guidance, not ground truth; v2 adds provenance so the user can verify.
- **Embedding cost on bulk upload** — guarded by `MAX_CHUNKS_PER_DOC = 100`. Per-project bound is implicit (the user has to upload them).
- **Stale embeddings after content change** — moot in v1 because there's no edit; delete + re-upload is the only update path. Add an explicit "re-embed" button later if edit lands.
- **Architectural over-fit.** The `ContextSource` generalization is *not* built yet — v1 implements `ProjectContextDoc` as its own concrete thing. Generalization waits until at least one more kind exists (Notion, etc.). Three similar lines beats a premature interface.

## Testing (per conventions §11 / §15)

- Zod input schema: one valid, two invalid (oversized content, wrong mimeType).
- Chunker: snapshot test against a fixture doc — verifies chunk count and overlap.
- `searchSimilarContextDocs`: integration test against a real Neon branch with a seeded doc + embedding, verifying scope filter (a doc in project A is not returned for project B).
- `retrieveProjectContext`: unit test with both repo and docs mocked, verifying merged shape.
- Action: integration test (`extractFromTranscript` → spec) with a doc attached, verifying the `docsContext` block appears in the recorded prompt.

## Done when

One PR: schema migration + repo + chunker + retrieval helper + actions + prompt wire-up across the four call sites + UI section + tests, all green (`pnpm -r check-types`, `pnpm --filter web lint`, `pnpm test`, `pnpm --filter web build`). After merge: create a `.md` PRD in the test project, then generate a spec and confirm the prompt includes a `docsContext` block in the server logs.

## Follow-ups (not this PR)

- **PDF extraction** — first follow-up. `pdf-parse` or `unpdf` server-side; otherwise identical pipeline.
- **Feature-scope attachments** — add `featureId String?` to `ProjectContextDoc`, extend retrieval to include feature-scoped docs when a feature is in context. ~1-day extension.
- **Provenance MVP** — when a spec field is generated, record which context source IDs were in the retrieved top-K. This is the Phase 2 roadmap item; this brief makes it cheap by ensuring every retrievable chunk already has a stable `(sourceType, sourceId)`.
- **Notion connector** — same `ContextSource` shape, different ingestion path. Worth doing only after files validate the abstraction is worth generalizing.
