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
import { generateQuestions } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockCreate.mockReset();
});

describe("generateQuestions", () => {
  it("returns parsed questions on a valid tool-use response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_questions",
          input: {
            questions: [
              { id: "q1", text: "Who uses this feature?" },
              { id: "q2", text: "What does success look like?" },
            ],
          },
        },
      ],
    });

    const result = await generateQuestions({
      idea: "Add pickup notes to orders",
      mode: "existing_system",
    });

    expect(result).toEqual([
      { id: "q1", text: "Who uses this feature?" },
      { id: "q2", text: "What does success look like?" },
    ]);

    const call = mockCreate.mock.calls[0]?.[0];
    expect(call?.model).toBe("test-model-questions");
    expect(call?.tool_choice).toEqual({ type: "tool", name: "record_questions" });
  });

  it("throws LlmError when the response has no tool_use block", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I refuse" }],
    });

    await expect(
      generateQuestions({ idea: "x", mode: "greenfield" }),
    ).rejects.toThrow(/tool_use/);
  });

  it("throws LlmError when the SDK call fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("network down"));

    await expect(
      generateQuestions({ idea: "x", mode: "greenfield" }),
    ).rejects.toThrow(/Anthropic call failed/);
  });
});
