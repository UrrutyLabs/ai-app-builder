import { z } from "zod";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type CheckConsistencyInput,
} from "./prompt";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 2048;

const IssueSchema = z.object({
  path: z.string().min(1),
  description: z.string().min(1),
});

const ToolInputSchema = z.object({
  issues: z.array(IssueSchema),
});

export interface ConsistencyIssue {
  path: string;
  description: string;
}

/**
 * Single Sonnet call surfacing cross-file inconsistencies in a generated batch.
 * Call site is expected to be wrapped in try/catch — failure here should never
 * block the PR from opening.
 */
export async function checkConsistency(
  input: CheckConsistencyInput,
): Promise<ConsistencyIssue[]> {
  const result = await runToolUse({
    step: "check-consistency",
    model: MODELS.spec,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_issues",
    toolDescription:
      "Record cross-file inconsistencies found in the generated batch. Empty array if none.",
    outputSchema: ToolInputSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  });
  return result.issues;
}

export type { CheckConsistencyInput } from "./prompt";
