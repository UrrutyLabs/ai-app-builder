import type {
  AffectedArea,
  ImplementationPlan,
  ImplementationStep,
} from "@repo/domain/schemas";
import type { ExportInput } from "./feature-export";

const AREA_LABEL: Record<AffectedArea, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  infrastructure: "Infrastructure",
  docs: "Docs",
  tests: "Tests",
};

function bullets(items: string[]): string {
  if (items.length === 0) return "_(none)_";
  return items.map((i) => `- ${i}`).join("\n");
}

function groupStepsByArea(
  steps: ImplementationStep[],
): Array<{ area: AffectedArea; steps: ImplementationStep[] }> {
  const groups = new Map<AffectedArea, ImplementationStep[]>();
  for (const step of steps) {
    const list = groups.get(step.area) ?? [];
    list.push(step);
    groups.set(step.area, list);
  }
  return Array.from(groups.entries()).map(([area, steps]) => ({ area, steps }));
}

function planMarkdown(plan: ImplementationPlan): string {
  const grouped = groupStepsByArea(plan.steps);

  const stepsBlock = grouped
    .map(
      ({ area, steps }) =>
        `#### ${AREA_LABEL[area]}\n\n` +
        steps
          .map((s, i) => `${i + 1}. **${s.title}** — ${s.description}`)
          .join("\n"),
    )
    .join("\n\n");

  const fileChanges =
    plan.fileChanges.length === 0
      ? "_(none)_"
      : plan.fileChanges
          .map((fc) => `- \`[${fc.action}]\` \`${fc.path}\` — ${fc.summary}`)
          .join("\n");

  const risks = plan.risks
    .map((r) => `- **${r.description}**\n  Mitigation: ${r.mitigation}`)
    .join("\n");

  return `## Implementation plan

### Summary

${plan.summary}

### Affected areas

${plan.affectedAreas.map((a) => `- ${AREA_LABEL[a]}`).join("\n")}

### File changes

${fileChanges}

### Steps

${stepsBlock}

### Test plan

${bullets(plan.testPlan)}

### Risks & edge cases

${risks}`;
}

export function exportToMarkdown(input: ExportInput): string {
  const { feature, project, questions, answers, spec, plan } = input;

  const modeLabel =
    project.mode === "greenfield" ? "Greenfield" : "Existing system";

  const meta = [
    `**Project:** ${project.name}`,
    `**Mode:** ${modeLabel}`,
    `**Status:** ${feature.status.replace(/_/g, " ").toLowerCase()}`,
    feature.approvedAt
      ? `**Approved:** ${feature.approvedAt.toISOString()}`
      : null,
  ]
    .filter(Boolean)
    .join("  \n");

  const parts: string[] = [];

  parts.push(`# ${feature.title}\n\n${meta}`);

  parts.push(`## Idea\n\n${feature.idea}`);

  if (questions && questions.length > 0) {
    const answersById = new Map((answers ?? []).map((a) => [a.questionId, a.text]));
    const qa = questions
      .map((q, i) => {
        const a = answersById.get(q.id);
        return `${i + 1}. **${q.text}**\n   ${a ?? "_(unanswered)_"}`;
      })
      .join("\n\n");
    parts.push(`## Clarifying questions\n\n${qa}`);
  }

  if (spec) {
    parts.push(
      [
        "## Feature spec",
        `### Problem\n\n${spec.problem}`,
        `### Goal\n\n${spec.goal}`,
        `### In scope\n\n${bullets(spec.scope.in)}`,
        `### Out of scope\n\n${bullets(spec.scope.out)}`,
        `### Actors\n\n${bullets(spec.actors)}`,
        `### User flows\n\n${bullets(spec.userFlows)}`,
        `### UI states\n\n${bullets(spec.uiStates)}`,
        `### Business rules\n\n${bullets(spec.businessRules)}`,
        `### Data changes\n\n${bullets(spec.dataChanges)}`,
        `### API changes\n\n${bullets(spec.apiChanges)}`,
        `### Acceptance criteria\n\n${bullets(spec.acceptanceCriteria)}`,
        `### Assumptions\n\n${bullets(spec.assumptions)}`,
        `### Open questions\n\n${bullets(spec.openQuestions)}`,
      ].join("\n\n"),
    );
  }

  if (plan) {
    parts.push(planMarkdown(plan));
  }

  return parts.join("\n\n") + "\n";
}
