import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

describe("extract-from-transcript prompts", () => {
  it("system prompt is stable", () => {
    expect(SYSTEM_PROMPT).toMatchSnapshot();
  });

  it("user prompt for greenfield includes transcript and mode context", () => {
    const prompt = buildUserPrompt({
      transcript:
        "Alice: I think drivers need pickup notes. Bob: yeah but only visible to drivers.",
      mode: "greenfield",
    });
    expect(prompt).toMatchSnapshot();
  });

  it("user prompt for existing_system includes repo + conventions context", () => {
    const prompt = buildUserPrompt({
      transcript: "Alice: We need a notes field. Bob: agreed.",
      mode: "existing_system",
      repoContext: "Repo: orders/, drivers/",
      conventionsContext: "Conventions:\n- Tailwind v4\n- Zod-first schemas",
      codeContext: "Relevant snippets:\norders/index.ts:1 export const ...",
    });
    expect(prompt).toMatchSnapshot();
  });
});
