# CLAUDE.md

> Orientation for Claude (or any AI agent) working in this repo. Read this first, then the canonical docs it points to. Keep this file short — do not duplicate the deep docs.

## What this is

**ai-app-builder** is a control plane for product → engineering translation. It transforms a vague feature idea into a structured `FeatureSpec` and a deterministic `ImplementationPlan`, with the human in the loop at every step.

It is **not** a code generator, an IDE, a Cursor competitor, or an autonomous agent. The value lives in narrowing requirements, making ambiguity explicit, and producing high-quality structured artifacts.

The pipeline (see `docs/architecture.md` for the current, fuller picture):
`idea (typed or distilled from a refinement transcript) → AI clarifying questions → user answers → AI FeatureSpec (streamed) → user edits + approves → AI ImplementationPlan → JSON/Markdown export or a GitHub PR`

All AI steps are grounded in the connected repo and any attached project context documents (PRD / domain model / notes). Auth + multi-tenancy are live. The deep docs are the source of truth for what's shipped; this line is just orientation.

## Read these first

Before writing or editing code, read:

- **[docs/architecture.md](docs/architecture.md)** — system structure, monorepo layout, package boundaries, data model, LLM integration, request flow per step. Source of truth for *what* we build.
- **[docs/conventions.md](docs/conventions.md)** — code-level rules: TS strictness, Zod-first schemas, server-action template, naming, testing, forbidden patterns. Source of truth for *how* we write it.
- **[docs/roadmap.md](docs/roadmap.md)** — what's shipped, what's planned (v0.2 → v1.0+). Update when scope changes.

If a required pattern is missing from these docs, propose adding it in the same PR rather than silently inventing a new pattern.

## Stack snapshot

- **Monorepo**: pnpm workspaces + Turborepo. Packages: `@repo/domain` (Zod schemas + types + errors + env), `@repo/db` (Prisma + repos), `@repo/ai` (Anthropic SDK + LLM steps).
- **App**: `apps/web` is a Next.js 16 (App Router, RSC + Server Actions) on Tailwind v4. Forms use react-hook-form + zodResolver against the same Zod schemas the backend uses.
- **Database**: Postgres on **Neon**. Pooled URL (`DATABASE_URL`) for runtime, direct URL (`DIRECT_URL`) for Prisma migrations. No local Docker.
- **LLM**: Anthropic only. Models routed via `packages/ai/src/models.ts` — Haiku 4.5 for questions, Sonnet 4.6 for spec, Opus 4.7 for plan. Override per env var (`AI_MODEL_QUESTIONS`, etc.). Structured output via Anthropic tool-use with Zod-derived JSON Schema.

## Working style (how to collaborate here)

These rules come from working sessions and are load-bearing. Don't dump full implementations on the user.

1. **Small, explained steps.** Propose the smallest version that fits the pipeline, name decisions and tradeoffs, then **wait for confirmation** before moving on. The user wants to stay in the driver's seat.
2. **No premature abstraction.** Three similar lines beats a clever helper. Don't pre-build hooks for deferred features — see `roadmap.md` for what's explicitly out of scope today (e.g. Figma/Notion ingestion, real-time collaboration, multi-LLM provider abstraction, a generalized `ContextSource` layer). Build the concrete thing; generalize only when a second real case exists.
3. **Never silently guess.** When requirements are ambiguous, surface assumptions and ask. This applies to code AND to the artifacts the product itself generates (specs, plans).
4. **Prefer structured outputs over prose.** Zod-validated JSON via tool-use beats freeform.

## Critical conventions to remember

(These are repeated from `docs/conventions.md` because violating them creates real bugs.)

- **Types are inferred from Zod, never hand-written alongside a schema.** `z.infer<typeof Schema>` is the only acceptable way to derive a type from a schema.
- **Server Actions are thin orchestration**: validate input with Zod → call `@repo/db` and/or `@repo/ai` → revalidate path → return `ActionResult<T>` discriminated union. Never throw to the client. Business logic lives in packages, not actions.
- **Prompts live colocated with their step** under `packages/ai/src/steps/<step>/prompt.ts` as pure functions returning a string. Never inline in components or actions.
- **Env access only through `@repo/domain/env`.** No `process.env.X` reads anywhere else. The env module validates at boot and throws on missing/invalid vars.
- **JSON columns** (`questions`, `answers`, `spec`, `plan`) are validated through their Zod schema on read AND write. To clear them, use `Prisma.DbNull` (not bare `null`).
- **Re-running a step discards downstream artifacts.** `setFeatureQuestions` clears `answers`/`spec`/`plan`/`approvedAt`; `setFeatureAnswers` clears `spec`/`plan`/`approvedAt`; `setFeatureSpec` clears `plan`/`approvedAt`. This is enforced in the repo functions, not the UI.

## Forbidden patterns

- `any` (use `unknown` and narrow). `as` casts outside `as const`, Zod parsers, and tests need a comment explaining why narrowing isn't possible.
- Hand-written TS types alongside a Zod schema for the same shape.
- Inline LLM prompts in components, actions, or route handlers.
- Server Action that does business logic instead of orchestrating packages.
- Default exports outside Next.js framework files (page/layout/route).

## Common commands

```sh
# Web app
pnpm --filter web dev          # Next dev server (loads root .env via dotenv-cli)
pnpm --filter web build        # Production build
pnpm --filter web check-types  # next typegen + tsc
pnpm --filter web lint

# All packages
pnpm -r lint
pnpm -r check-types
pnpm test                      # turbo run test (vitest in domain + ai packages)

# Database (run from packages/db)
pnpm --filter @repo/db exec dotenv -e ../../.env -- prisma migrate dev --name <name>
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db db:generate
```

## Gotchas

- **Env loading.** Next.js auto-loads `.env` from `apps/web/`, not the monorepo root. We use `dotenv-cli` in package scripts to load `../../.env`. If you add a new package that reads env, prefix its scripts the same way.
- **Prisma + monorepo .env.** `prisma migrate dev` doesn't walk up directories looking for `.env`. Always invoke via `dotenv -e ../../.env --` or it errors on missing `DIRECT_URL`.
- **`pnpm --filter <pkg> <script> -- <args>`** mangles `--` arg passing in some cases (extra `--` breaks Prisma name flag). For the `prisma migrate dev --name <x>` invocation, run the package script directly via `pnpm exec` from the package dir to avoid this.
- **`temperature` is deprecated for Opus 4.7** — `tool-use.ts` makes it optional and the plan step omits it. Sonnet and Haiku still accept it.
- **`exactOptionalPropertyTypes` is on** — passing explicit `undefined` to an optional prop fails. Either narrow with `?? null` at call sites, or type the prop as `T | undefined`.
- **Neon credentials end up in transcripts** when Claude reads `.env`. After significant credential exposure, rotate via Neon's *Roles* dashboard.

## When in doubt

- Read [architecture.md](docs/architecture.md) and [conventions.md](docs/conventions.md) before writing or editing code.
- Ask clarifying questions when requirements are ambiguous; never silently guess.
- Produce a plan referencing affected packages before editing.
- List assumptions explicitly in your response.
- Keep changes scoped — one feature per PR.
