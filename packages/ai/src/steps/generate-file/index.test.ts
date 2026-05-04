import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../models", () => ({
  MODELS: {
    questions: "test-model-questions",
    spec: "test-model-spec",
    plan: "test-model-plan",
    code: "test-model-code",
  },
}));

import { anthropic } from "../../client";
import { generateFile } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

const baseInput = {
  featureTitle: "Pickup notes",
  featureIdea: "Add pickup notes to orders",
  spec: {
    title: "Pickup notes",
    problem: "x",
    goal: "y",
    mode: "existing_system" as const,
    scope: { in: ["a"], out: [] },
    actors: [],
    userFlows: [],
    uiStates: [],
    businessRules: [],
    dataChanges: [],
    apiChanges: [],
    acceptanceCriteria: ["criteria"],
    assumptions: [],
    openQuestions: [],
  },
  fileChange: {
    path: "src/foo.ts",
    action: "create" as const,
    summary: "Util",
  },
  conventionsContext: null,
  codeContext: null,
  previousFiles: [],
};

function toolUseResponse(content: string) {
  return {
    content: [
      {
        type: "tool_use",
        name: "record_file_content",
        input: { content },
      },
    ],
  };
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("generateFile", () => {
  it("returns content directly when first attempt parses cleanly", async () => {
    mockCreate.mockResolvedValueOnce(
      toolUseResponse("export const x = 1;\n"),
    );

    const result = await generateFile(baseInput);
    expect(result).toEqual({
      path: "src/foo.ts",
      content: "export const x = 1;\n",
      verified: true,
      verifyError: null,
      repaired: false,
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries once on parse failure and returns the repaired content", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("export function broken( {"))
      .mockResolvedValueOnce(
        toolUseResponse("export function fixed() { return 1; }"),
      );

    const result = await generateFile(baseInput);
    expect(result.verified).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.content).toContain("fixed");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("returns the repair attempt even when it still fails to parse", async () => {
    mockCreate
      .mockResolvedValueOnce(toolUseResponse("export function broken( {"))
      .mockResolvedValueOnce(toolUseResponse("export function still broken( {"));

    const result = await generateFile(baseInput);
    expect(result.verified).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.verifyError).toBeTruthy();
  });

  it("skips verification entirely for non-JS/TS extensions", async () => {
    mockCreate.mockResolvedValueOnce(toolUseResponse("name: my-action\n"));

    const result = await generateFile({
      ...baseInput,
      fileChange: {
        path: ".github/workflows/ci.yaml",
        action: "create" as const,
        summary: "CI workflow",
      },
    });
    expect(result.verified).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("triggers typecheck repair when parse passes but typecheck fails", async () => {
    // First attempt: parses fine, but has a type error.
    // Second attempt: typecheck-clean.
    mockCreate
      .mockResolvedValueOnce(
        toolUseResponse(
          `export function add(a: number, b: number): number { return a + "oops"; }\n`,
        ),
      )
      .mockResolvedValueOnce(
        toolUseResponse(
          `export function add(a: number, b: number): number { return a + b; }\n`,
        ),
      );

    const result = await generateFile(baseInput);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.verified).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.content).toContain("a + b");

    // Confirm the second call's prompt mentioned typecheck (not parse)
    const secondCallArgs = mockCreate.mock.calls[1]?.[0];
    expect(secondCallArgs?.messages?.[0]?.content).toMatch(/type errors/i);
  });

  it("keeps the repair attempt when typecheck still fails after retry", async () => {
    // Both attempts have type errors; both parse cleanly.
    mockCreate
      .mockResolvedValueOnce(
        toolUseResponse(`export const x: number = "still wrong";\n`),
      )
      .mockResolvedValueOnce(
        toolUseResponse(`export const x: number = "still wrong too";\n`),
      );

    const result = await generateFile(baseInput);
    expect(result.verified).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.verifyError).toMatch(/not assignable/);
  });
});
