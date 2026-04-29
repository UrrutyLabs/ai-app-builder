import type { Answer, Question } from "@repo/domain/schemas";

export interface GenerateSpecInput {
  title: string;
  idea: string;
  mode: "greenfield" | "existing_system";
  questions: Question[];
  answers: Answer[];
}

export const SYSTEM_PROMPT = `You are an expert product engineer. You translate vague feature ideas into structured FeatureSpecs that engineers can build from with no further ambiguity.

Principles:
- Ground every field in the user's idea and Q&A. Do NOT invent facts that aren't supported.
- If a question went unanswered, surface it in \`openQuestions\` rather than guessing.
- If you had to make a non-trivial inference, surface it in \`assumptions\`.
- Acceptance criteria must be observable and testable — written so a QA engineer could verify each one.
- For \`scope.in\` and \`scope.out\`, be specific. "Out of scope" is as important as "in scope".
- For \`existing_system\` mode, assume an existing codebase, users, and conventions to respect.
- For \`greenfield\` mode, you can be more flexible about conventions but still concrete about the product.
- Polish the title — make it short and crisp. The provided title is just a working label.
- Do NOT prescribe implementation details (file layouts, libraries, db indexes, framework choices). Stay at the product/spec level.

Output via the \`record_feature_spec\` tool.`;

export function buildUserPrompt(input: GenerateSpecInput): string {
  const modeLine =
    input.mode === "greenfield"
      ? "Mode: GREENFIELD — new project, no existing code constraints."
      : "Mode: EXISTING_SYSTEM — feature on top of an existing codebase, user base, and conventions.";

  const answersById = new Map(input.answers.map((a) => [a.questionId, a.text]));
  const qaLines = input.questions
    .map((q, i) => {
      const a = answersById.get(q.id);
      return `${i + 1}. Q: ${q.text}\n   A: ${a ?? "(unanswered)"}`;
    })
    .join("\n");

  return `Working title (refine if you can): ${input.title}

${modeLine}

Feature idea (raw):
"""
${input.idea}
"""

Clarifying questions and answers:
${qaLines}

Now produce the FeatureSpec via the \`record_feature_spec\` tool.`;
}
