export interface ExtractFromDocumentInput {
  documentTitle: string;
  document: string;
  mode: "greenfield" | "existing_system";
  repoContext?: string | null;
  conventionsContext?: string | null;
  codeContext?: string | null;
  docsContext?: string | null;
}

export const SYSTEM_PROMPT = `You are an expert product engineer turning an authored product document (a PRD, requirements doc, spec, or notes) into a structured starting point for ONE feature spec.

Unlike a meeting transcript, this document is deliberately written and usually structured (goals, requirements, acceptance criteria, open issues). Your job is to MAP that structure onto our shape — and to recognise when the document covers more than one feature.

Rules:
- Pick exactly ONE feature: the most concrete, self-contained one the document describes. Build the title/idea/decisions/constraints/openQuestions for THAT feature only.
- title: a short, concrete feature name (≤ 8 words). Not a sentence.
- idea: 1–3 sentences capturing the problem and the proposed feature, in the document's own terms.
- decisions: requirements the document states as settled for this feature — concrete, present tense ("Notes are visible only to drivers"). One per bullet.
- constraints: limits, assumptions, or non-goals the document states ("Must not require a migration"). One per bullet.
- openQuestions: gaps, "TBD"s, or ambiguities in the document for this feature. One per bullet. These seed the clarifying-questions step.
- otherFeaturesDetected: if the document clearly describes OTHER, separate features beyond the one you picked, list a one-line summary of each here. These are NOT created — they are surfaced so the user can create them separately. Empty if the document is about a single feature.
- Do NOT invent requirements the document does not state. If something is unstated, it belongs in openQuestions, not decisions.
- Do NOT propose an implementation. No file paths, no library choices, no DB schema. That comes later.
- If the document has no real feature in it (e.g. a glossary), return short/empty arrays — empty is allowed.`;

export function buildUserPrompt(input: ExtractFromDocumentInput): string {
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
  const codeBlock = input.codeContext ? `\n\n${input.codeContext}\n` : "";
  const docsBlock = input.docsContext ? `\n\n${input.docsContext}\n` : "";

  return `Mode: ${modeContext}${docsBlock}${repoBlock}${conventionsBlock}${codeBlock}

Source document — "${input.documentTitle}":
"""
${input.document}
"""

Extract ONE feature: title, idea, decisions, constraints, openQuestions. List any other features the document describes in otherFeaturesDetected.`;
}
