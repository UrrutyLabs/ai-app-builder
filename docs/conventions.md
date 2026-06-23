# Coding Conventions

> Code-level rules. ARCHITECTURE.md says **what** we build; this document says **how** we write it. Pull-request rule: anything that violates this document is blocked unless this document is updated first.

## 1. Language

- **TypeScript, maximum strict.** `tsconfig.json` (root) sets:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "noFallthroughCasesInSwitch": true,
      "exactOptionalPropertyTypes": true,
      "forceConsistentCasingInFileNames": true,
      "verbatimModuleSyntax": true,
      "moduleResolution": "Bundler",
      "target": "ES2022"
    }
  }
  ```
- `any` is forbidden. Use `unknown` and narrow.
- `as` casts are forbidden except (a) `as const`, (b) inside Zod parsers we already wrote, (c) test files. Every other cast needs a comment explaining why narrowing isn't possible.
- Non-null assertions (`!`) are forbidden in app code, allowed in tests.
- No default exports except for Next.js page/layout/route files (framework requires it). Everything else uses named exports.

## 2. Schemas first (Zod everywhere)

The single rule that matters most: **types are inferred from Zod, never hand-written alongside a schema.**

```ts
// packages/domain/src/schemas/feature-spec.ts
import { z } from "zod";

export const FeatureSpecSchema = z.object({
  title: z.string().min(1),
  problem: z.string().min(1),
  goal: z.string().min(1),
  mode: z.enum(["greenfield", "existing_system"]),
  scope: z.object({
    in:  z.array(z.string()),
    out: z.array(z.string()),
  }),
  actors: z.array(z.string()),
  userFlows: z.array(z.string()),
  uiStates: z.array(z.string()),
  businessRules: z.array(z.string()),
  dataChanges: z.array(z.string()),
  apiChanges: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  assumptions: z.array(z.string()),
  openQuestions: z.array(z.string()),
});

export type FeatureSpec = z.infer<typeof FeatureSpecSchema>;
```

Rules:

- One schema per domain object lives in `packages/domain/src/schemas/`.
- Every Server Action validates its input with a Zod schema **before** anything else runs.
- Every LLM-produced object is parsed through its Zod schema before leaving `packages/ai`.
- Form validation in the UI uses the same schema via `@hookform/resolvers/zod`.
- DB layer parses JSON columns through the schema on read; if it fails, throw `ValidationError`.

If you're tempted to write a TypeScript type and "remember to validate later", stop and write the Zod schema instead.

## 3. Project structure inside `apps/web`

```
apps/web/src/
├─ app/
│   ├─ layout.tsx
│   ├─ page.tsx                          # dashboard
│   ├─ projects/
│   │   ├─ new/page.tsx
│   │   └─ [projectId]/
│   │       ├─ page.tsx
│   │       └─ features/
│   │           ├─ new/page.tsx
│   │           └─ [featureId]/
│   │               ├─ page.tsx
│   │               ├─ questions/page.tsx
│   │               ├─ spec/page.tsx
│   │               └─ plan/page.tsx
│   └─ _actions/                         # server actions, one file per domain
│       ├─ projects.ts
│       ├─ features.ts
│       ├─ questions.ts
│       ├─ spec.ts
│       └─ plan.ts
├─ components/
│   ├─ ui/                               # shadcn-generated primitives
│   ├─ forms/
│   ├─ spec-editor/
│   └─ ...
├─ lib/
│   ├─ format.ts
│   └─ utils.ts                          # shadcn cn() helper
└─ styles/globals.css
```

- Pages and layouts live in `app/`. Reusable UI lives in `components/`.
- Folders prefixed with `_` (like `_actions`) are private to the route group and are not routed.
- `lib/` is for pure helpers with no React or DB dependencies.

## 4. Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`.
- React components: `PascalCase` and the file matches the default export name when possible.
- Hooks: `useCamelCase`.
- Server Actions: `verbNoun` (e.g. `generateQuestions`, `approveSpec`).
- Zod schemas: `PascalCaseSchema`. Inferred types: `PascalCase` (no suffix).
- Enums in TS: avoid them; prefer `as const` literal unions. Prisma enums are SCREAMING_SNAKE_CASE.
- Test files: same name as the source plus `.test.ts` (unit) or `.spec.ts` (integration).

## 5. Server vs Client components

- **Default to Server Components.** A file becomes a Client Component only when it needs `useState`, `useEffect`, event handlers, or a browser-only API.
- Mark client leaves with `"use client"` at the top. Don't push `"use client"` to a layout to "make children work" — push it down to the smallest interactive leaf.
- Server Components import freely from `packages/db` and `packages/ai`. Client Components must not — they call Server Actions instead.
- No data fetching libraries (React Query, SWR). Fetch in RSCs, mutate via Server Actions, revalidate paths.

### Design system

- **Primitives: shadcn/ui** (radix-nova style), generated into `apps/web/src/components/ui/`. These are owned source files — edit them when needed (e.g. to satisfy `exactOptionalPropertyTypes`). They live in the app, not `packages/ui`, until a second consumer exists.
- **Icons: `lucide-react`.** No inline SVG icon paths, no emoji. Import the named icon component.
- **Toasts: `sonner`.** Mutation feedback (success/error) goes through a toast, not an inline `<p>`. The `<Toaster>` is mounted once in the root layout.
- **`cn()` from `@/lib/utils`** (clsx + tailwind-merge) for conditional classes — never hand-concatenate class strings.
- **The workspace shell** (header + sidebar) lives under a `(workspace)` route group with a shared `layout.tsx`. Shell pieces are in `components/layout/`. Keep them Server Components where possible; push `"use client"` to the smallest interactive leaf (e.g. the sidebar toggle, the project-switcher dropdown).

## 6. Server Actions

Every Server Action follows this template:

```ts
// apps/web/src/app/_actions/spec.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { GenerateSpecInputSchema } from "@repo/domain/schemas";
import { generateSpec } from "@repo/ai/steps/generate-spec";
import { saveFeatureSpec } from "@repo/db/features";
import { toActionError } from "@/lib/action-error";
import type { ActionResult, FeatureSpec } from "@repo/domain";

export async function generateSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureSpec>> {
  try {
    const input = GenerateSpecInputSchema.parse(raw);
    const spec  = await generateSpec(input);
    await saveFeatureSpec(input.featureId, spec);
    revalidatePath(`/projects/${input.projectId}/features/${input.featureId}`);
    return { ok: true, data: spec };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
```

Rules:

- Every action: `"use server"` at the top, accepts `raw: unknown`, validates with Zod inside the function.
- Returns the `ActionResult<T>` discriminated union from `packages/domain`. **Never** lets exceptions bubble to the client.
- Calls `revalidatePath` for every successful mutation.
- Server Actions are **thin orchestration only** — no business logic, no LLM prompt construction, no SQL. Those live in `packages/ai` and `packages/db`.

## 7. Route Handlers

Reserve `app/api/.../route.ts` for cases that Server Actions cannot serve (streaming, third-party webhooks, non-form clients). Current route handlers: `api/auth/[...path]` (Neon Auth), `api/pr/create` and `api/spec/stream` (SSE streaming). If you add another, justify it in the PR description — a Server Action is the default.

## 8. LLM call conventions (`packages/ai`)

- One file per step under `src/steps/<step>/index.ts`.
- The step file exports a single async function returning a validated, typed object.
- The prompt is a sibling pure function in `src/steps/<step>/prompt.ts`. Prompts are deterministic strings built from typed inputs.
- Every step uses Anthropic **tool use** with a Zod-derived JSON schema (see ARCHITECTURE.md §8).
- Model selection goes through `src/models.ts` — never hard-code model IDs at call sites.
- Temperature, max tokens, and retry policy are constants at the top of the step file. Document any non-default value with a one-line comment.
- Network failures and parse failures throw `LlmError` carrying `{ step, rawResponse }`. Never swallow.
- Each step ships a Vitest snapshot test against a fixture input that asserts (a) the prompt is stable and (b) Zod accepts a recorded sample response.

## 9. Error handling

`packages/domain/src/errors.ts`:

```ts
export class AppError extends Error {
  constructor(public code: string, message: string, public cause?: unknown) {
    super(message);
  }
}
export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) { super("VALIDATION", message, cause); }
}
export class NotFoundError   extends AppError { /* ... */ }
export class ConflictError   extends AppError { /* ... */ }
export class LlmError        extends AppError { /* ... */ }
```

- Inside packages: throw the typed error.
- At Server Action boundary: `toActionError(err)` maps to `{ code, message }`. Unknown errors become `{ code: "INTERNAL", message: "Something went wrong" }`. Full stack is `console.error`'d server-side.
- Never `try / catch / console.log / continue`. If you catch, you handle.

## 10. Forms

- `react-hook-form` + `@hookform/resolvers/zod`, using the **same** Zod schema as the Server Action.
- Use shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` primitives.
- Submit handler calls the Server Action and renders `error.message` in a toast on failure.
- Don't optimistic-update; revalidate and re-render.

## 11. Testing (Vitest)

- One unit test file colocated with the source: `feature-spec.ts` → `feature-spec.test.ts`.
- Mandatory unit tests:
  - All Zod schemas (happy path + at least two failure cases).
  - Every prompt builder in `packages/ai` (snapshot of the rendered prompt for a fixture input).
  - All pure helpers in `lib/`.
- Mandatory integration tests (`*.spec.ts`):
  - End-to-end pipeline for one feature: idea → questions → spec → plan, with the Anthropic client mocked at the SDK boundary.
- No tests for trivial RSC pages or shadcn-generated components.
- No E2E (Playwright) yet.
- Run `pnpm test` (unit) and `pnpm test:integration` separately. Both must be green to merge.

## 12. Lint, format, commits

- ESLint config: `next/core-web-vitals`, `@typescript-eslint/strict-type-checked`, `eslint-plugin-import` (sorted imports), `eslint-plugin-tailwindcss`. No `any`, no unused exports.
- Prettier with `prettier-plugin-tailwindcss`.
- Conventional Commits enforced via `commitlint` + Husky `commit-msg` hook. Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `build`, `ci`. Scope is the package name where useful (e.g. `feat(ai): generate-plan step`).
- `pnpm lint && pnpm typecheck && pnpm test` runs in CI on every PR.
- Pre-commit hook runs `pnpm lint --fix` and `pnpm format` on staged files via `lint-staged`.

## 13. Environment variables

- All env access goes through `packages/domain/src/env.ts`, which validates `process.env` with Zod at module load. App fails to boot on missing/invalid env.
- No `process.env.X` reads anywhere else. ESLint rule enforces this.
- Required vars (validated in `packages/domain/src/env-schema.ts`):
  ```
  DATABASE_URL=...                             # Neon pooled connection
  DIRECT_URL=...                               # Neon direct connection (for Prisma migrations)
  ANTHROPIC_API_KEY=...                        # LLM steps
  OPENAI_API_KEY=...                           # embeddings (repo + context docs)
  ENCRYPTION_KEY=...                           # AES-256-GCM for stored GitHub tokens
  NEON_AUTH_BASE_URL=...                        # Neon Auth (Better Auth)
  NEON_AUTH_COOKIE_SECRET=...                   # Neon Auth session cookie (min 32 chars)
  AI_MODEL_QUESTIONS=claude-haiku-4-5-20251001 # optional override (default: haiku)
  AI_MODEL_SPEC=claude-sonnet-4-6              # optional override (default: sonnet)
  AI_MODEL_PLAN=claude-opus-4-7                # optional override (default: opus)
  AI_MODEL_CODE=claude-sonnet-4-6              # optional override (default: sonnet)
  ```
- `.env.example` is committed; `.env` is gitignored. Update `.env.example` whenever the schema changes.

## 14. Imports & paths

- Path aliases: `@repo/db`, `@repo/ai`, `@repo/domain` for packages. `@/` for paths inside `apps/web/src`.
- No `../../..` imports across packages — only via the alias.
- Import order (enforced by ESLint): node builtins → external → `@repo/*` → `@/` → relative. Blank line between groups.

## 15. Definition of done (per PR)

A change is done when **all** of the following are true:

1. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration` are green.
2. Any new Zod schema has unit tests for one valid and at least two invalid inputs.
3. Any new Server Action validates its input with Zod and returns `ActionResult<T>`.
4. Any new LLM step has a snapshot prompt test and a fixture-response Zod test.
5. Any new env var is added to `packages/domain/src/env.ts` **and** `.env.example`.
6. ARCHITECTURE.md or CONVENTIONS.md is updated if the change introduces a new pattern.
7. The PR description names the user-facing capability the change unlocks (or "internal: …" if it doesn't).

## 16. Forbidden patterns

These show up in PRs and never get merged:

- `any`, `as` casts (outside the three exceptions in §1), non-null `!` in app code.
- Hand-written TS types alongside a Zod schema for the same shape.
- Inline LLM prompts in components, actions, or route handlers.
- `process.env` reads outside `packages/domain/src/env.ts`.
- Catching an error to log it and re-throwing a generic one (loses cause). Use `new AppError(..., cause)` or rethrow.
- Server Action that does business logic instead of orchestrating packages.
- Default exports outside Next.js framework files.
- Adding a dependency without an entry in the PR description explaining why an existing tool can't do it.

## 17. AI behavior contract (when Claude writes code on this repo)

When extending this codebase, the assistant must:

1. Read both ARCHITECTURE.md and CONVENTIONS.md before writing or editing code.
2. Ask clarifying questions when requirements are ambiguous; never silently guess.
3. Produce a plan referencing affected packages before editing.
4. List assumptions explicitly in the response.
5. Prefer structured outputs (Zod-validated) over prose.
6. Keep changes scoped — one feature per PR.
7. If a required pattern is missing from this document, propose adding it here in the same PR rather than inventing a new pattern silently.
