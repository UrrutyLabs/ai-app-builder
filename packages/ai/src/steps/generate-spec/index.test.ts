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
import { generateSpec } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

const validSpecPayload = {
  title: "Pickup notes on orders",
  problem: "Drivers miss customer instructions at pickup time.",
  goal: "Let customers attach a note that drivers see at pickup.",
  mode: "existing_system",
  scope: {
    in: ["Note field on order create flow", "Note shown on driver pickup screen"],
    out: ["Edit-after-creation", "Notes on completed orders"],
  },
  actors: ["customer", "driver"],
  userFlows: ["Customer enters note when placing order"],
  uiStates: ["Note textarea on order form"],
  businessRules: ["Note max 500 chars", "Note is optional"],
  dataChanges: ["Order.pickupNotes column"],
  apiChanges: ["POST /orders accepts pickupNotes"],
  acceptanceCriteria: ["Driver sees notes in pickup screen when present"],
  assumptions: ["Existing Order schema can be migrated"],
  openQuestions: ["Should staff be allowed to edit notes after order placement?"],
};

const validInput = {
  title: "Pickup notes",
  idea: "Add pickup notes to orders",
  mode: "existing_system" as const,
  questions: [{ id: "q1", text: "Who writes the notes?" }],
  answers: [{ questionId: "q1", text: "Customers." }],
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe("generateSpec", () => {
  it("returns the parsed spec on a valid tool-use response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_feature_spec",
          input: validSpecPayload,
        },
      ],
    });

    const result = await generateSpec(validInput);
    expect(result.title).toBe("Pickup notes on orders");
    expect(result.scope.in).toHaveLength(2);

    const call = mockCreate.mock.calls[0]?.[0];
    expect(call?.model).toBe("test-model-spec");
    expect(call?.tool_choice).toEqual({
      type: "tool",
      name: "record_feature_spec",
    });
  });

  it("retries once on LlmError and succeeds", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("transient network"))
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            name: "record_feature_spec",
            input: validSpecPayload,
          },
        ],
      });

    const result = await generateSpec(validInput);
    expect(result.title).toBe("Pickup notes on orders");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws when both attempts fail", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("first failure"))
      .mockRejectedValueOnce(new Error("second failure"));

    await expect(generateSpec(validInput)).rejects.toThrow(
      /Anthropic call failed/,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
