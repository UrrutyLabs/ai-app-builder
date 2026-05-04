import { describe, expect, it } from "vitest";
import { applyEdits } from "./apply-edits";

describe("applyEdits", () => {
  it("applies a single edit", () => {
    const result = applyEdits("hello world", [
      { search: "world", replace: "there" },
    ]);
    expect(result.content).toBe("hello there");
    expect(result.failures).toEqual([]);
  });

  it("applies multiple edits sequentially", () => {
    const result = applyEdits("a\nb\nc\n", [
      { search: "a\n", replace: "A\n" },
      { search: "b\n", replace: "B\n" },
    ]);
    expect(result.content).toBe("A\nB\nc\n");
    expect(result.failures).toEqual([]);
  });

  it("supports an empty replace (deletion)", () => {
    const result = applyEdits("hello, world", [
      { search: "hello, ", replace: "" },
    ]);
    expect(result.content).toBe("world");
  });

  it("records a failure when the search string is missing", () => {
    const result = applyEdits("hello", [
      { search: "missing", replace: "x" },
    ]);
    expect(result.content).toBe("hello");
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.reason).toMatch(/not found/);
  });

  it("records a failure when the search string matches more than once", () => {
    const result = applyEdits("foo bar foo", [
      { search: "foo", replace: "FOO" },
    ]);
    // Original is unchanged because the edit failed
    expect(result.content).toBe("foo bar foo");
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.reason).toMatch(/ambiguous/);
  });

  it("partial success: applies the edits that succeed, records failures for the rest", () => {
    const result = applyEdits("alpha\nbeta\n", [
      { search: "alpha", replace: "ALPHA" },
      { search: "missing", replace: "x" },
    ]);
    expect(result.content).toBe("ALPHA\nbeta\n");
    expect(result.failures).toHaveLength(1);
  });

  it("a later edit can target the result of an earlier edit", () => {
    const result = applyEdits("abc", [
      { search: "abc", replace: "abcd" },
      { search: "abcd", replace: "abcde" },
    ]);
    expect(result.content).toBe("abcde");
  });
});
