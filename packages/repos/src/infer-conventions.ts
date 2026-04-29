import {
  EMPTY_CONVENTIONS,
  type Conventions,
  type FileTree,
} from "@repo/domain/schemas";
import { fetchFileContents } from "./fetch-files";
import type { GitHubRepoRef } from "./github";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
  workspaces?: unknown;
}

interface TsConfig {
  compilerOptions?: {
    strict?: boolean;
  };
}

function safeParseJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// tsconfig.json supports comments and trailing commas (JSONC). Strip
// comments before JSON.parse — naive but handles real-world cases.
function safeParseJsonc<T>(s: string | null): T | null {
  if (!s) return null;
  const stripped = s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"])\/\/.*$/gm, (_match, prefix: string) => prefix)
    .replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(stripped) as T;
  } catch {
    return null;
  }
}

function stripVersionPrefix(v: string): string {
  return v.replace(/^[\^~>=<]+/, "");
}

function allDeps(pkg: PackageJson | null): Record<string, string> {
  return { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
}

function detectFramework(pkg: PackageJson | null): string | null {
  const deps = allDeps(pkg);
  if (deps.next) return `Next.js ${stripVersionPrefix(deps.next)}`;
  if (deps["@remix-run/react"])
    return `Remix ${stripVersionPrefix(deps["@remix-run/react"])}`;
  if (deps.nuxt) return `Nuxt ${stripVersionPrefix(deps.nuxt)}`;
  if (deps["@nestjs/core"])
    return `NestJS ${stripVersionPrefix(deps["@nestjs/core"])}`;
  if (deps.express) return `Express ${stripVersionPrefix(deps.express)}`;
  if (deps.fastify) return `Fastify ${stripVersionPrefix(deps.fastify)}`;
  if (deps.hono) return `Hono ${stripVersionPrefix(deps.hono)}`;
  if (deps.vite) return `Vite ${stripVersionPrefix(deps.vite)}`;
  if (deps.react) return `React ${stripVersionPrefix(deps.react)}`;
  return null;
}

function detectTestStack(pkg: PackageJson | null): string[] {
  const deps = allDeps(pkg);
  const stack: string[] = [];
  if (deps.vitest) stack.push("Vitest");
  if (deps.jest || deps["@jest/core"]) stack.push("Jest");
  if (deps.mocha) stack.push("Mocha");
  if (deps["@playwright/test"] || deps.playwright) stack.push("Playwright");
  if (deps.cypress) stack.push("Cypress");
  return stack;
}

function detectStyling(pkg: PackageJson | null): string[] {
  const deps = allDeps(pkg);
  const styling: string[] = [];
  if (deps.tailwindcss) {
    const major = stripVersionPrefix(deps.tailwindcss).split(".")[0];
    styling.push(`Tailwind v${major ?? ""}`.trim().replace(/v$/, "Tailwind"));
  }
  if (deps["styled-components"]) styling.push("styled-components");
  if (deps["@emotion/react"]) styling.push("Emotion");
  return styling;
}

function detectOrm(
  pkg: PackageJson | null,
  schemaPrisma: string | null,
): { orm: string | null; database: string | null } {
  const deps = allDeps(pkg);
  if (deps.prisma || deps["@prisma/client"]) {
    let database: string | null = null;
    if (schemaPrisma) {
      const m = /provider\s*=\s*"(\w+)"/.exec(schemaPrisma);
      const provider = m?.[1];
      const map: Record<string, string> = {
        postgresql: "PostgreSQL",
        mysql: "MySQL",
        sqlite: "SQLite",
        mongodb: "MongoDB",
        sqlserver: "SQL Server",
        cockroachdb: "CockroachDB",
      };
      if (provider) database = map[provider] ?? provider;
    }
    return { orm: "Prisma", database };
  }
  if (deps["drizzle-orm"]) return { orm: "Drizzle", database: null };
  if (deps.sequelize) return { orm: "Sequelize", database: null };
  if (deps.typeorm) return { orm: "TypeORM", database: null };
  if (deps.mongoose) return { orm: "Mongoose", database: "MongoDB" };
  return { orm: null, database: null };
}

function detectFormAndValidation(pkg: PackageJson | null): {
  formLib: string[];
  validation: string[];
} {
  const deps = allDeps(pkg);
  const formLib: string[] = [];
  const validation: string[] = [];
  if (deps["react-hook-form"]) formLib.push("react-hook-form");
  if (deps.formik) formLib.push("Formik");
  if (deps["@tanstack/react-form"]) formLib.push("TanStack Form");
  if (deps.zod) validation.push("Zod");
  if (deps.yup) validation.push("Yup");
  if (deps.joi) validation.push("Joi");
  return { formLib, validation };
}

function detectMonorepo(
  pkg: PackageJson | null,
  hasPnpmWorkspace: boolean,
): string | null {
  const deps = allDeps(pkg);
  const tools: string[] = [];
  if (deps.turbo) tools.push("Turborepo");
  if (deps.nx) tools.push("Nx");
  if (deps["@microsoft/rush"]) tools.push("Rush");
  if (hasPnpmWorkspace) tools.push("pnpm workspaces");
  else if (pkg?.workspaces) tools.push("npm/yarn workspaces");
  return tools.length > 0 ? tools.join(" + ") : null;
}

function detectPackageManager(
  pkg: PackageJson | null,
  hasPnpmWorkspace: boolean,
): string | null {
  if (pkg?.packageManager) {
    const m = /^(\w+)@/.exec(pkg.packageManager);
    if (m && m[1]) return m[1];
  }
  if (hasPnpmWorkspace) return "pnpm";
  return null;
}

export function inferConventions(input: {
  packageJson: string | null;
  tsconfig: string | null;
  schemaPrisma: string | null;
  hasPnpmWorkspace: boolean;
}): Conventions {
  const pkg = safeParseJson<PackageJson>(input.packageJson);
  const ts = safeParseJsonc<TsConfig>(input.tsconfig);

  const { orm, database } = detectOrm(pkg, input.schemaPrisma);
  const { formLib, validation } = detectFormAndValidation(pkg);

  return {
    framework: detectFramework(pkg),
    language: ts ? "TypeScript" : null,
    testStack: detectTestStack(pkg),
    styling: detectStyling(pkg),
    orm,
    database,
    formLib,
    validation,
    monorepo: detectMonorepo(pkg, input.hasPnpmWorkspace),
    tsStrict: ts ? ts.compilerOptions?.strict === true : null,
    packageManager: detectPackageManager(pkg, input.hasPnpmWorkspace),
    notes: [],
  };
}

export async function fetchAndInferConventions({
  ref,
  token,
  fileTree,
}: {
  ref: GitHubRepoRef;
  token: string;
  fileTree: FileTree;
}): Promise<Conventions> {
  const treePaths = new Set(fileTree.entries.map((e) => e.path));

  const candidates: string[] = [];
  if (treePaths.has("package.json")) candidates.push("package.json");
  if (treePaths.has("tsconfig.json")) candidates.push("tsconfig.json");
  if (treePaths.has("prisma/schema.prisma"))
    candidates.push("prisma/schema.prisma");

  const hasPnpmWorkspace = treePaths.has("pnpm-workspace.yaml");

  if (candidates.length === 0 && !hasPnpmWorkspace) {
    return EMPTY_CONVENTIONS;
  }

  const contents = await fetchFileContents({ ref, token, paths: candidates });

  return inferConventions({
    packageJson: contents.get("package.json") ?? null,
    tsconfig: contents.get("tsconfig.json") ?? null,
    schemaPrisma: contents.get("prisma/schema.prisma") ?? null,
    hasPnpmWorkspace,
  });
}
