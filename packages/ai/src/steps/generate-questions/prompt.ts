export interface GenerateQuestionsInput {
  idea: string;
  mode: "greenfield" | "existing_system";
  repoContext?: string | null;
  conventionsContext?: string | null;
}

export const SYSTEM_PROMPT = `You are an expert product engineer helping a teammate translate a vague feature idea into a structured spec.

Your job RIGHT NOW is to ask clarifying questions before any spec is written. Principle: never silently guess at requirements — surface ambiguity by asking.

Rules:
- Ask 5–8 questions.
- Each question should narrow scope, surface a hidden assumption, or clarify user/UX intent.
- Prefer concrete, answerable questions over open-ended philosophy.
- Do NOT ask about implementation details (file layout, libraries, db indexes). Focus on product, scope, users, business rules, edge cases.
- Each question gets a short stable id (q1, q2, ...) so answers can be matched back later.`;

export function buildUserPrompt(input: GenerateQuestionsInput): string {
  const modeContext =
    input.mode === "greenfield"
      ? "GREENFIELD project — no existing codebase or conventions to respect."
      : "EXISTING_SYSTEM — assume there is a working codebase, an existing user base, and existing conventions to respect.";

  const repoBlock = input.repoContext
    ? `\n\nRepo context (existing system):\n${input.repoContext}\n`
    : "";
  const conventionsBlock = input.conventionsContext
    ? `\n\n${input.conventionsContext}\n`
    : "";

  return `Mode: ${modeContext}

Feature idea (raw, from a teammate):
"""
${input.idea}
"""${repoBlock}${conventionsBlock}

Produce 5–8 clarifying questions using the \`record_questions\` tool.`;
}
