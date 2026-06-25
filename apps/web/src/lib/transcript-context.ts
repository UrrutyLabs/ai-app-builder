import type { DecisionRecord } from "@repo/db";

export type GroupedDecisions = {
  decisions: string[];
  constraints: string[];
  openQuestions: string[];
};

/**
 * Group a feature's active decisions by kind for display and prompting.
 * Rejected/superseded decisions are excluded — only live ones ground the work.
 */
export function groupDecisions(decisions: DecisionRecord[]): GroupedDecisions {
  const active = decisions.filter(
    (d) => d.status !== "REJECTED" && d.status !== "SUPERSEDED",
  );
  return {
    decisions: active
      .filter((d) => d.kind === "DECISION")
      .map((d) => d.statement),
    constraints: active
      .filter((d) => d.kind === "CONSTRAINT")
      .map((d) => d.statement),
    openQuestions: active
      .filter((d) => d.kind === "OPEN_QUESTION")
      .map((d) => d.statement),
  };
}

/**
 * Render a feature's decisions as the grounding block for question / spec
 * generation. Output is byte-identical to the prior transcript-context block,
 * so swapping the source (blob → Decision rows) changes no prompt input.
 */
export function renderDecisionsContext(
  decisions: DecisionRecord[],
): string | null {
  const g = groupDecisions(decisions);
  const sections: string[] = [];
  if (g.decisions.length) {
    sections.push(
      `Decisions settled in the refinement transcript:\n${g.decisions
        .map((d) => `- ${d}`)
        .join("\n")}`,
    );
  }
  if (g.constraints.length) {
    sections.push(
      `Constraints surfaced in the transcript:\n${g.constraints
        .map((c) => `- ${c}`)
        .join("\n")}`,
    );
  }
  if (g.openQuestions.length) {
    sections.push(
      `Open questions left unresolved in the transcript:\n${g.openQuestions
        .map((q) => `- ${q}`)
        .join("\n")}`,
    );
  }
  if (!sections.length) return null;
  return sections.join("\n\n");
}
