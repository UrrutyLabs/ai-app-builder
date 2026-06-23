export interface ExtractFromTranscriptInput {
  transcript: string;
  mode: "greenfield" | "existing_system";
  repoContext?: string | null;
  conventionsContext?: string | null;
  codeContext?: string | null;
  docsContext?: string | null;
}

export const SYSTEM_PROMPT = `You are an expert product engineer helping a teammate turn a raw refinement-meeting transcript into a structured starting point for a feature spec.

The transcript is rough: interruptions, half-finished sentences, side-tangents, multiple voices. Your job is to distill it — never invent.

Rules:
- Pick ONE feature. If the transcript covers more than one, choose the most concretely discussed and ignore the rest.
- title: a short, concrete feature name (≤ 8 words). Not a sentence.
- idea: 1–3 sentences capturing the problem and the proposed feature. Use the participants' words where possible.
- decisions: things the discussion actually settled — concrete, present tense ("Notes are visible only to drivers"). One per bullet.
- constraints: limits, assumptions, or non-goals surfaced in the discussion ("Must not require a migration"). One per bullet.
- openQuestions: things explicitly left unresolved or that surfaced as ambiguous. One per bullet. These will seed the clarifying-questions step.
- Do NOT hallucinate decisions or constraints that were not discussed. If the transcript didn't settle something, it belongs in openQuestions, not decisions.
- Do NOT propose an implementation. No file paths, no library choices, no DB schema. That comes later.
- If the transcript is too thin to extract anything meaningful, return short arrays — empty is allowed.`;

export function buildUserPrompt(input: ExtractFromTranscriptInput): string {
  const modeContext =
    input.mode === "greenfield"
      ? "GREENFIELD project — no existing codebase or conventions yet."
      : "EXISTING_SYSTEM — there is a working codebase and existing conventions to respect.";

  const repoBlock = input.repoContext
    ? `\n\nRepo context (existing system):\n${input.repoContext}\n`
    : "";
  const conventionsBlock = input.conventionsContext
    ? `\n\n${input.conventionsContext}\n`
    : "";
  const codeBlock = input.codeContext
    ? `\n\n${input.codeContext}\n`
    : "";
  const docsBlock = input.docsContext
    ? `\n\n${input.docsContext}\n`
    : "";

  return `Mode: ${modeContext}${docsBlock}${repoBlock}${conventionsBlock}${codeBlock}

Refinement transcript (raw, may be messy):
"""
${input.transcript}
"""

Extract the feature: title, idea, decisions, constraints, openQuestions.`;
}
