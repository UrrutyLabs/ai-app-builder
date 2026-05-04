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
import { checkConsistency } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

const baseInput = {
  spec: {
    title: "Pickup notes",
    problem: "x",
    goal: "y",
    mode: "existing_system" as const,
    scope: { in: [], out: [] },
    actors: [],
    userFlows: [],
    uiStates: [],
    businessRules: [],
    dataChanges: [],
    apiChanges: [],
    acceptanceCriteria: [],
    assumptions: [],
    openQuestions: [],
  },
  files: [
    { path: "src/a.ts", content: "export const a = 1;" },
    { path: "src/b.ts", content: "import { z } from './a';" },
  ],
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe("checkConsistency", () => {
  it("returns the issues from a populated tool-use response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_issues",
          input: {
            issues: [
              {
                path: "src/b.ts",
                description: "Imports `z` from ./a but a only exports `a`.",
              },
            ],
          },
        },
      ],
    });

    const result = await checkConsistency(baseInput);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("src/b.ts");

    const call = mockCreate.mock.calls[0]?.[0];
    expect(call?.model).toBe("test-model-spec");
  });

  it("returns an empty array when the tool input has no issues", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_issues",
          input: { issues: [] },
        },
      ],
    });

    const result = await checkConsistency(baseInput);
    expect(result).toEqual([]);
  });
});
