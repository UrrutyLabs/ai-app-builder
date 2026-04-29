import { describe, expect, it } from "vitest";
import {
  ConnectRepoInputSchema,
  FileTreeSchema,
} from "./repo";

describe("FileTreeSchema", () => {
  it("accepts a tree with mixed entries", () => {
    const result = FileTreeSchema.safeParse({
      truncated: false,
      entries: [
        { path: "src", type: "dir" },
        { path: "src/index.ts", type: "file", size: 120 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an entry with empty path", () => {
    const result = FileTreeSchema.safeParse({
      truncated: false,
      entries: [{ path: "", type: "file" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an entry with unknown type", () => {
    const result = FileTreeSchema.safeParse({
      truncated: false,
      entries: [{ path: "x", type: "symlink" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("ConnectRepoInputSchema", () => {
  it("accepts a valid input", () => {
    const result = ConnectRepoInputSchema.safeParse({
      projectId: "proj_123",
      repoUrl: "https://github.com/foo/bar",
      pat: "ghp_xxx",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty PAT", () => {
    const result = ConnectRepoInputSchema.safeParse({
      projectId: "proj_123",
      repoUrl: "https://github.com/foo/bar",
      pat: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty repoUrl", () => {
    const result = ConnectRepoInputSchema.safeParse({
      projectId: "proj_123",
      repoUrl: "",
      pat: "ghp_xxx",
    });
    expect(result.success).toBe(false);
  });
});
