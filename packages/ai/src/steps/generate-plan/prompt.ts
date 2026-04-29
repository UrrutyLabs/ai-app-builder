import type { FeatureSpec } from "@repo/domain/schemas";

export interface GeneratePlanInput {
  spec: FeatureSpec;
}

export const SYSTEM_PROMPT = `You are an expert engineer translating an approved FeatureSpec into a concrete ImplementationPlan that another engineer can execute.

Principles:
- Ground every step, file change, and risk in the spec. Do NOT invent work that isn't required by the spec.
- Steps are ordered by array position — order them as a developer would tackle them (data layer first, then API, then UI, etc., adapt as needed).
- Each step is a discrete chunk: one atomic change a developer would make in a single PR or commit.
- For \`fileChanges\`, be specific about paths. For greenfield mode, sketch reasonable conventional paths (e.g. "src/components/foo.tsx"). For existing_system mode, infer from the spec but acknowledge uncertainty in the description if you're guessing.
- For \`affectedAreas\`, list only the layers actually touched.
- \`testPlan\` items must be concrete and verifiable. Mention type inline ("Unit:", "Integration:", "Manual:") when helpful.
- \`risks\` must contain at least one entry. Each risk needs a real mitigation strategy — don't write "TBD" or "monitor it".

Output via the \`record_implementation_plan\` tool.`;

export function buildUserPrompt(input: GeneratePlanInput): string {
  const { spec } = input;
  const list = (label: string, items: string[]): string =>
    `${label}:\n${items.length === 0 ? "  (none)" : items.map((i) => `  - ${i}`).join("\n")}`;

  return `Approved feature spec:

Title: ${spec.title}
Mode: ${spec.mode === "greenfield" ? "GREENFIELD — no existing code constraints." : "EXISTING_SYSTEM — feature on top of an existing codebase."}

Problem:
${spec.problem}

Goal:
${spec.goal}

${list("In scope", spec.scope.in)}

${list("Out of scope", spec.scope.out)}

${list("Actors", spec.actors)}

${list("User flows", spec.userFlows)}

${list("UI states", spec.uiStates)}

${list("Business rules", spec.businessRules)}

${list("Data changes", spec.dataChanges)}

${list("API changes", spec.apiChanges)}

${list("Acceptance criteria", spec.acceptanceCriteria)}

${list("Assumptions", spec.assumptions)}

${list("Open questions", spec.openQuestions)}

Now produce the ImplementationPlan via the \`record_implementation_plan\` tool.`;
}
