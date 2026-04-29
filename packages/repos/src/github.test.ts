import { describe, expect, it } from "vitest";
import { parseGitHubUrl } from "./github";

describe("parseGitHubUrl", () => {
  it.each([
    ["https://github.com/foo/bar", "foo", "bar"],
    ["https://github.com/foo/bar.git", "foo", "bar"],
    ["https://github.com/foo/bar/", "foo", "bar"],
    ["http://github.com/foo/bar", "foo", "bar"],
    ["github.com/foo/bar", "foo", "bar"],
    ["git@github.com:foo/bar.git", "foo", "bar"],
    ["  https://github.com/foo/bar  ", "foo", "bar"],
  ])("parses %s", (input, owner, repo) => {
    expect(parseGitHubUrl(input)).toEqual({ owner, repo });
  });

  it("rejects non-github hosts", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/foo/bar")).toThrow();
  });

  it("rejects when only owner is present", () => {
    expect(() => parseGitHubUrl("https://github.com/foo")).toThrow();
  });

  it("rejects empty input", () => {
    expect(() => parseGitHubUrl("")).toThrow();
  });
});
