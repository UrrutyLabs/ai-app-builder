import { describe, expect, it } from "vitest";
import { ConventionsSchema, EMPTY_CONVENTIONS } from "./conventions";

describe("ConventionsSchema", () => {
  it("accepts the empty default", () => {
    expect(ConventionsSchema.safeParse(EMPTY_CONVENTIONS).success).toBe(true);
  });

  it("accepts a populated value", () => {
    const result = ConventionsSchema.safeParse({
      framework: "Next.js 16",
      language: "TypeScript",
      testStack: ["Vitest"],
      styling: ["Tailwind v4"],
      orm: "Prisma",
      database: "PostgreSQL",
      formLib: ["react-hook-form"],
      validation: ["Zod"],
      monorepo: "Turborepo + pnpm workspaces",
      tsStrict: true,
      packageManager: "pnpm",
      notes: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when required arrays are missing", () => {
    const result = ConventionsSchema.safeParse({
      ...EMPTY_CONVENTIONS,
      testStack: undefined,
    });
    expect(result.success).toBe(false);
  });
});
