import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

describe("generate-questions prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt for greenfield includes idea and mode context", () => {
    const prompt = buildUserPrompt({
      idea: "Add pickup notes to orders",
      mode: "greenfield",
    });
    expect(prompt).toMatchSnapshot();
  });

  it("user prompt for existing_system includes idea and mode context", () => {
    const prompt = buildUserPrompt({
      idea: "Add pickup notes to orders",
      mode: "existing_system",
    });
    expect(prompt).toMatchSnapshot();
  });
});
