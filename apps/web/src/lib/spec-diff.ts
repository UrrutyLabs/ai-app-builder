import { createTwoFilesPatch } from "diff";
import type { FeatureSpec } from "@repo/domain/schemas";

/**
 * Render a FeatureSpec as a stable, line-oriented text suitable for diffing.
 * Field order is fixed; arrays are rendered one-per-line; multi-line strings
 * (problem, goal) get their own labelled paragraph.
 */
export function specToText(spec: FeatureSpec): string {
  const lines: string[] = [];
  lines.push(`Title: ${spec.title}`);
  lines.push(`Mode: ${spec.mode}`);
  lines.push("");
  lines.push("## Problem");
  lines.push(spec.problem);
  lines.push("");
  lines.push("## Goal");
  lines.push(spec.goal);
  lines.push("");
  lines.push("## In scope");
  lines.push(...spec.scope.in.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Out of scope");
  lines.push(...spec.scope.out.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Actors");
  lines.push(...spec.actors.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## User flows");
  lines.push(...spec.userFlows.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## UI states");
  lines.push(...spec.uiStates.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Business rules");
  lines.push(...spec.businessRules.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Data changes");
  lines.push(...spec.dataChanges.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## API changes");
  lines.push(...spec.apiChanges.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Acceptance criteria");
  lines.push(...spec.acceptanceCriteria.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Assumptions");
  lines.push(...spec.assumptions.map((s) => `- ${s}`));
  lines.push("");
  lines.push("## Open questions");
  lines.push(...spec.openQuestions.map((s) => `- ${s}`));
  return lines.join("\n");
}

export interface DiffLine {
  type: "context" | "add" | "remove" | "header";
  text: string;
}

/**
 * Compute a unified diff between two specs and parse it into structured lines
 * suitable for inline rendering with colored backgrounds.
 */
export function diffSpecs(
  before: FeatureSpec | null,
  after: FeatureSpec,
  labelBefore = "before",
  labelAfter = "after",
): DiffLine[] {
  const beforeText = before ? specToText(before) : "";
  const afterText = specToText(after);
  const patch = createTwoFilesPatch(
    labelBefore,
    labelAfter,
    beforeText,
    afterText,
    "",
    "",
    { context: 3 },
  );
  return parsePatch(patch);
}

function parsePatch(patch: string): DiffLine[] {
  const lines = patch.split("\n");
  const result: DiffLine[] = [];
  // Skip the first 4 lines (Index/===/--- /+++) which are file headers.
  let started = false;
  for (const line of lines) {
    if (!started) {
      if (line.startsWith("@@")) started = true;
      else continue;
    }
    if (line.startsWith("@@")) {
      result.push({ type: "header", text: line });
    } else if (line.startsWith("+")) {
      result.push({ type: "add", text: line.slice(1) });
    } else if (line.startsWith("-")) {
      result.push({ type: "remove", text: line.slice(1) });
    } else if (line.startsWith(" ")) {
      result.push({ type: "context", text: line.slice(1) });
    }
    // Skip "\ No newline at end of file" sentinels and other noise.
  }
  return result;
}
