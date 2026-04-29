import { describe, expect, it } from "vitest";
import {
  EMPTY_CONVENTIONS,
  type Conventions,
} from "@repo/domain/schemas";
import {
  shortStackLabel,
  summarizeConventions,
} from "./summarize-conventions";

const populated: Conventions = {
  framework: "Next.js 16.2.0",
  language: "TypeScript",
  testStack: ["Vitest", "Playwright"],
  styling: ["Tailwind v4"],
  orm: "Prisma",
  database: "PostgreSQL",
  formLib: ["react-hook-form"],
  validation: ["Zod"],
  monorepo: "Turborepo + pnpm workspaces",
  tsStrict: true,
  packageManager: "pnpm",
  notes: [],
};

describe("summarizeConventions", () => {
  it("renders a stable summary for a populated value", () => {
    expect(summarizeConventions(populated)).toMatchSnapshot();
  });

  it("returns empty string when nothing is detected", () => {
    expect(summarizeConventions(EMPTY_CONVENTIONS)).toBe("");
  });
});

describe("shortStackLabel", () => {
  it("renders a compact label", () => {
    expect(shortStackLabel(populated)).toBe(
      "Next.js 16.2.0 · Tailwind v4 · Vitest · Prisma (PostgreSQL) · Turborepo + pnpm workspaces",
    );
  });

  it("returns empty string when nothing detected", () => {
    expect(shortStackLabel(EMPTY_CONVENTIONS)).toBe("");
  });
});
