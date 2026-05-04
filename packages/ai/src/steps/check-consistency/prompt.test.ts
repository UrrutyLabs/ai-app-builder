import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const fixtureSpec = {
  title: "Pickup notes on orders",
  problem: "x",
  goal: "Add pickup notes",
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
};

describe("check-consistency prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt includes the spec title and all file contents", () => {
    const prompt = buildUserPrompt({
      spec: fixtureSpec,
      files: [
        { path: "src/a.ts", content: "export const a = 1;" },
        { path: "src/b.ts", content: "import { a } from './a';" },
      ],
    });
    expect(prompt).toContain("Pickup notes on orders");
    expect(prompt).toContain("--- src/a.ts ---");
    expect(prompt).toContain("export const a = 1;");
    expect(prompt).toContain("--- src/b.ts ---");
  });
});
