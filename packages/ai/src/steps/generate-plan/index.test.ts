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
  },
}));

import { anthropic } from "../../client";
import { generatePlan } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

const validPlanPayload = {
  summary: "Add pickupNotes column and surface to driver UI.",
  affectedAreas: ["frontend", "backend", "database"],
  fileChanges: [
    {
      path: "prisma/schema.prisma",
      action: "modify",
      summary: "Add pickupNotes column",
    },
  ],
  steps: [
    {
      title: "Migrate Order schema",
      description: "Add pickupNotes column.",
      area: "database",
    },
  ],
  testPlan: ["Unit: pickupNotes max length validation"],
  risks: [
    {
      description: "Existing orders have null notes.",
      mitigation: "UI renders empty state for null.",
    },
  ],
};

const validInput = {
  spec: {
    title: "Pickup notes",
    problem: "x",
    goal: "y",
    mode: "existing_system" as const,
    scope: { in: ["a"], out: ["b"] },
    actors: ["c"],
    userFlows: ["d"],
    uiStates: ["e"],
    businessRules: ["f"],
    dataChanges: ["g"],
    apiChanges: ["h"],
    acceptanceCriteria: ["i"],
    assumptions: ["j"],
    openQuestions: ["k"],
  },
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe("generatePlan", () => {
  it("returns parsed plan on a valid tool-use response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_implementation_plan",
          input: validPlanPayload,
        },
      ],
    });

    const result = await generatePlan(validInput);
    expect(result.steps).toHaveLength(1);
    expect(result.risks).toHaveLength(1);

    const call = mockCreate.mock.calls[0]?.[0];
    expect(call?.model).toBe("test-model-plan");
    expect(call?.tool_choice).toEqual({
      type: "tool",
      name: "record_implementation_plan",
    });
  });

  it("retries once on failure and succeeds", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            name: "record_implementation_plan",
            input: validPlanPayload,
          },
        ],
      });

    const result = await generatePlan(validInput);
    expect(result.summary).toBe("Add pickupNotes column and surface to driver UI.");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
