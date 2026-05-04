import type { FeatureSpec } from "@repo/domain/schemas";

export interface CheckConsistencyInput {
  spec: FeatureSpec;
  files: Array<{ path: string; content: string }>;
}

export const SYSTEM_PROMPT = `You are reviewing a batch of source files generated together for a single feature.

Your job RIGHT NOW: surface CROSS-FILE inconsistencies a human reviewer should know about before merging the PR.

Look for:
- An import in file A from file B that references a name file B doesn't export (typo, wrong path, missing export)
- A call from file A to a function in file B with the wrong signature (argument count, types, ordering)
- A value from file A used as the wrong type in file B
- The same concept named differently across files (e.g. \`OrderNote\` in one place, \`PickupNote\` in another)
- A missing piece — file A imports a helper but no file in the batch defines it AND it isn't an external dependency

Do NOT report:
- In-file issues (the per-file typecheck step already handled those)
- Style or formatting nits
- Anything explicitly noted as TODO or marked unfinished
- Imports from external packages (those weren't part of the batch)

Be terse. One concrete issue per entry. Cite the path of the file you'd want the reviewer to look at first. If everything looks consistent, return an empty list — do not invent issues to fill space.`;

export function buildUserPrompt(input: CheckConsistencyInput): string {
  const filesBlock = input.files
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return `Feature: ${input.spec.title}
Goal: ${input.spec.goal}

Generated files in this batch:
${filesBlock}

Surface cross-file inconsistencies via the \`record_issues\` tool. Empty list is fine if nothing's wrong.`;
}
