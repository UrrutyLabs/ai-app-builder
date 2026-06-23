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
import { extractFromTranscript } from "./index";

const mockCreate = anthropic.messages.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockCreate.mockReset();
});

describe("extractFromTranscript", () => {
  it("returns the parsed extraction on a valid tool-use response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "record_transcript_extraction",
          input: {
            title: "Pickup notes on orders",
            idea: "Drivers need a notes field on orders so they can see customer instructions.",
            decisions: ["Notes are visible only to drivers."],
            constraints: ["Should not require a migration."],
            openQuestions: ["Are notes editable after the order is placed?"],
          },
        },
      ],
    });

    const result = await extractFromTranscript({
      transcript:
        "Alice: drivers need pickup notes. Bob: yeah, but only visible to drivers, and no migration.",
      mode: "existing_system",
    });

    expect(result.title).toBe("Pickup notes on orders");
    expect(result.decisions).toHaveLength(1);
    expect(result.openQuestions).toHaveLength(1);

    const call = mockCreate.mock.calls[0]?.[0];
    expect(call?.model).toBe("test-model-spec");
    expect(call?.tool_choice).toEqual({
      type: "tool",
      name: "record_transcript_extraction",
    });
  });

  it("throws LlmError when the response has no tool_use block (after retry)", async () => {
    // Step uses retries: 1 — mock both attempts.
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "I refuse" }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "still no" }],
      });

    await expect(
      extractFromTranscript({
        transcript: "Alice: do the thing. Bob: ok.",
        mode: "greenfield",
      }),
    ).rejects.toThrow(/tool_use/);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
