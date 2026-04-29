import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const fixture = {
  title: "Pickup notes on orders",
  idea: "I want to add pickup notes to orders so drivers see customer instructions",
  mode: "existing_system" as const,
  questions: [
    { id: "q1", text: "Who writes the pickup notes?" },
    { id: "q2", text: "Are notes editable after creation?" },
    { id: "q3", text: "What is the max length?" },
  ],
  answers: [
    { questionId: "q1", text: "Customers, at order creation time." },
    { questionId: "q3", text: "500 characters." },
  ],
};

describe("generate-spec prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt includes title, mode, idea, and Q&A", () => {
    expect(buildUserPrompt(fixture)).toMatchSnapshot();
  });

  it("marks unanswered questions explicitly", () => {
    const prompt = buildUserPrompt(fixture);
    expect(prompt).toContain("(unanswered)");
  });

  it("renders greenfield mode line for greenfield input", () => {
    const prompt = buildUserPrompt({ ...fixture, mode: "greenfield" });
    expect(prompt).toContain("GREENFIELD");
  });
});
