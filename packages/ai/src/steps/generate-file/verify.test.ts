import { describe, expect, it } from "vitest";
import { verifySyntax } from "./verify";

describe("verifySyntax", () => {
  it("accepts a valid TypeScript file", () => {
    expect(
      verifySyntax(
        "src/foo.ts",
        `export function foo(x: number): number { return x + 1; }`,
      ),
    ).toEqual({ ok: true, error: null });
  });

  it("accepts JSX/TSX with React-style returns", () => {
    expect(
      verifySyntax(
        "src/foo.tsx",
        `export function Foo() { return <div>hi</div>; }`,
      ),
    ).toEqual({ ok: true, error: null });
  });

  it("rejects malformed TypeScript", () => {
    const result = verifySyntax(
      "src/foo.ts",
      `export function foo( { return 1 }`,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("skips verification for unsupported extensions", () => {
    expect(verifySyntax("src/data.yaml", "this: is yaml")).toEqual({
      ok: true,
      error: null,
    });
    expect(verifySyntax("README.md", "# title\n\n```\nx\n```")).toEqual({
      ok: true,
      error: null,
    });
  });

  it("skips files without an extension", () => {
    expect(verifySyntax("Dockerfile", "FROM node:22")).toEqual({
      ok: true,
      error: null,
    });
  });
});
