import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const fixtureSpec = {
  title: "Pickup notes on orders",
  problem: "Drivers miss customer instructions at pickup.",
  goal: "Customers attach notes that drivers see at pickup.",
  mode: "existing_system" as const,
  scope: { in: ["Notes field on order create flow"], out: [] },
  actors: ["customer", "driver"],
  userFlows: [],
  uiStates: [],
  businessRules: ["Note max 500 chars"],
  dataChanges: [],
  apiChanges: [],
  acceptanceCriteria: ["Driver sees notes when present"],
  assumptions: [],
  openQuestions: [],
};

const baseInput = {
  featureTitle: "Pickup notes on orders",
  featureIdea: "Add pickup notes to orders",
  spec: fixtureSpec,
  fileChange: {
    path: "apps/web/src/components/forms/order-notes-field.tsx",
    action: "create" as const,
    summary: "Textarea component for order pickup notes (max 500 chars)",
  },
  conventionsContext: null,
  codeContext: null,
  previousFiles: [],
};

describe("generate-file prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt includes path, summary, and acceptance criteria", () => {
    expect(buildUserPrompt(baseInput)).toMatchSnapshot();
  });

  it("includes previously generated files when present", () => {
    const prompt = buildUserPrompt({
      ...baseInput,
      previousFiles: [
        {
          path: "apps/web/src/lib/order-notes.ts",
          content: "export const MAX = 500;\n",
        },
      ],
    });
    expect(prompt).toContain("apps/web/src/lib/order-notes.ts");
    expect(prompt).toContain("export const MAX = 500;");
  });

  it("includes a repair section when retryError + retryAttempt are present", () => {
    const prompt = buildUserPrompt({
      ...baseInput,
      retryError: "Unexpected token (4:8)",
      retryAttempt: "broken code here",
    });
    expect(prompt).toContain("failed to parse");
    expect(prompt).toContain("Unexpected token");
    expect(prompt).toContain("broken code here");
  });
});
