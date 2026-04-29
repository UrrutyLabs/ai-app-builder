import { describe, expect, it } from "vitest";
import { inferConventions } from "./infer-conventions";

const monorepoPackageJson = JSON.stringify({
  name: "ai-app-builder",
  packageManager: "pnpm@9.0.0",
  devDependencies: {
    turbo: "^2.9.6",
    typescript: "5.9.2",
  },
});

const webPackageJson = JSON.stringify({
  name: "web",
  dependencies: {
    next: "16.2.0",
    react: "^19.2.0",
    "react-hook-form": "^7.54.0",
    zod: "^3.24.0",
    "@prisma/client": "^6.2.0",
    tailwindcss: "^4.0.0",
  },
  devDependencies: {
    vitest: "^3.2.4",
    "@playwright/test": "^1.50.0",
  },
});

const tsconfig = `{
  // strict everywhere
  "compilerOptions": {
    "strict": true,
    "target": "ES2022"
  }
}`;

const schemaPrisma = `
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

describe("inferConventions", () => {
  it("detects a Next.js + Prisma + Vitest + Tailwind stack", () => {
    const c = inferConventions({
      packageJson: webPackageJson,
      tsconfig,
      schemaPrisma,
      hasPnpmWorkspace: true,
    });
    expect(c.framework).toMatch(/^Next\.js/);
    expect(c.language).toBe("TypeScript");
    expect(c.tsStrict).toBe(true);
    expect(c.testStack).toContain("Vitest");
    expect(c.testStack).toContain("Playwright");
    expect(c.styling[0]).toMatch(/Tailwind/);
    expect(c.orm).toBe("Prisma");
    expect(c.database).toBe("PostgreSQL");
    expect(c.formLib).toContain("react-hook-form");
    expect(c.validation).toContain("Zod");
    expect(c.packageManager).toBe("pnpm");
    expect(c.monorepo).toContain("pnpm workspaces");
  });

  it("detects Turborepo when present in deps", () => {
    const c = inferConventions({
      packageJson: monorepoPackageJson,
      tsconfig: null,
      schemaPrisma: null,
      hasPnpmWorkspace: true,
    });
    expect(c.monorepo).toContain("Turborepo");
    expect(c.monorepo).toContain("pnpm workspaces");
    expect(c.packageManager).toBe("pnpm");
  });

  it("returns nullable defaults when no inputs are provided", () => {
    const c = inferConventions({
      packageJson: null,
      tsconfig: null,
      schemaPrisma: null,
      hasPnpmWorkspace: false,
    });
    expect(c.framework).toBeNull();
    expect(c.language).toBeNull();
    expect(c.testStack).toEqual([]);
    expect(c.orm).toBeNull();
  });

  it("survives invalid JSON in package.json", () => {
    const c = inferConventions({
      packageJson: "{ not valid",
      tsconfig: null,
      schemaPrisma: null,
      hasPnpmWorkspace: false,
    });
    expect(c.framework).toBeNull();
  });
});
