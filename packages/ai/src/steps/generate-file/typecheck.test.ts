import { describe, expect, it } from "vitest";
import { typecheck } from "./typecheck";

describe("typecheck", () => {
  it("accepts a clean TypeScript file", () => {
    const result = typecheck(
      "src/foo.ts",
      `export function add(a: number, b: number): number {
  return a + b;
}
`,
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("flags a real type error", () => {
    const result = typecheck(
      "src/foo.ts",
      `export function add(a: number, b: number): number {
  return a + "oops";
}
`,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("not assignable"))).toBe(true);
  });

  it("ignores cannot-find-module errors for external imports", () => {
    const result = typecheck(
      "src/foo.ts",
      `import { something } from "@external/never-installed";
export const x = something;
`,
    );
    // The import won't resolve but we filter that error.
    // 'something' resolves to any (since the import is unresolved), so x: any.
    expect(result.ok).toBe(true);
  });

  it("ignores known Node globals (process, Buffer, etc.)", () => {
    const result = typecheck(
      "src/foo.ts",
      `export const env = process.env.MY_VAR;
export const buf = Buffer.from("hello");
`,
    );
    expect(result.ok).toBe(true);
  });

  it("catches a real Cannot find name error", () => {
    const result = typecheck(
      "src/foo.ts",
      `export const x = thisIsNotDefinedAnywhere;
`,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /TS230\d/.test(e))).toBe(true);
  });

  it("skips non-TS extensions", () => {
    expect(typecheck("README.md", "# hi")).toEqual({ ok: true, errors: [] });
    expect(typecheck("data.json", "{}")).toEqual({ ok: true, errors: [] });
  });

  it("doesn't crash when previous files are present (cross-file type drift is a known gap)", () => {
    // NOTE: cross-file type drift detection (file B uses an export from file A
    // with the wrong type) doesn't fire today. Module resolution through our
    // virtual host doesn't surface the import to the type checker; imports
    // that don't resolve become `any`. This means we won't catch every
    // batch-internal mismatch — but we also don't false-positive on missing
    // imports. Tracked as a v0.4c.5 enhancement.
    const previous = [
      {
        path: "src/util.ts",
        content: `export function util(): string { return "x"; }\n`,
      },
    ];
    const result = typecheck(
      "src/main.ts",
      `import { util } from "./util";
const s = util();
export { s };
`,
      previous,
    );
    expect(result.ok).toBe(true);
  });
});
