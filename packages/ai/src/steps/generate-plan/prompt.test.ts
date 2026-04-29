import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const fixtureSpec = {
  title: "Pickup notes on orders",
  problem: "Drivers miss customer instructions at pickup.",
  goal: "Customers attach a note that drivers see at pickup.",
  mode: "existing_system" as const,
  scope: {
    in: ["Note field on order create flow"],
    out: ["Edit-after-completion"],
  },
  actors: ["customer", "driver"],
  userFlows: ["Customer enters note when placing order"],
  uiStates: ["Note textarea on order form"],
  businessRules: ["Note max 500 chars"],
  dataChanges: ["Add Order.pickupNotes column"],
  apiChanges: ["POST /orders accepts pickupNotes"],
  acceptanceCriteria: ["Driver sees notes in pickup screen"],
  assumptions: ["Existing schema is mutable"],
  openQuestions: ["Editable after creation?"],
};

describe("generate-plan prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt includes title, mode, and spec sections", () => {
    expect(buildUserPrompt({ spec: fixtureSpec })).toMatchSnapshot();
  });

  it("renders empty arrays as (none)", () => {
    const prompt = buildUserPrompt({
      spec: { ...fixtureSpec, openQuestions: [] },
    });
    expect(prompt).toContain("Open questions:\n  (none)");
  });
});
