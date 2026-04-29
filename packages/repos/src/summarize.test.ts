import { describe, expect, it } from "vitest";
import type { FileTree } from "@repo/domain/schemas";
import { summarizeTree } from "./summarize";

const fixtureTree: FileTree = {
  truncated: false,
  entries: [
    { path: "package.json", type: "file" },
    { path: "tsconfig.json", type: "file" },
    { path: "turbo.json", type: "file" },
    { path: "README.md", type: "file" },
    { path: "apps", type: "dir" },
    { path: "apps/web", type: "dir" },
    { path: "apps/web/package.json", type: "file" },
    { path: "apps/web/next.config.js", type: "file" },
    { path: "apps/web/src", type: "dir" },
    { path: "apps/web/src/app/page.tsx", type: "file" },
    { path: "apps/web/src/app/layout.tsx", type: "file" },
    { path: "packages", type: "dir" },
    { path: "packages/domain", type: "dir" },
    { path: "packages/domain/package.json", type: "file" },
    { path: "packages/domain/src/index.ts", type: "file" },
    { path: "packages/db", type: "dir" },
    { path: "packages/db/package.json", type: "file" },
    { path: "packages/db/prisma/schema.prisma", type: "file" },
    { path: "packages/db/src/client.ts", type: "file" },
  ],
};

describe("summarizeTree", () => {
  it("renders a stable summary for a monorepo fixture", () => {
    expect(summarizeTree(fixtureTree)).toMatchSnapshot();
  });

  it("notes truncation when the tree was clipped", () => {
    const truncated = { ...fixtureTree, truncated: true };
    expect(summarizeTree(truncated)).toContain("truncated");
  });

  it("handles an empty tree", () => {
    expect(summarizeTree({ truncated: false, entries: [] })).toContain(
      "Total: 0 source files",
    );
  });
});
