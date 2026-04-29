import {
  ImplementationPlanSchema,
  type ImplementationPlan,
} from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type GeneratePlanInput,
} from "./prompt";

const MAX_TOKENS = 8192;
const RETRIES = 1;
// Opus 4.7 deprecated `temperature` — we omit it and let the model use its
// internal sampling default. Sonnet/Haiku still accept it elsewhere.

export async function generatePlan(
  input: GeneratePlanInput,
): Promise<ImplementationPlan> {
  return runToolUse({
    step: "generate-plan",
    model: MODELS.plan,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_implementation_plan",
    toolDescription:
      "Record the structured implementation plan derived from the approved feature spec.",
    outputSchema: ImplementationPlanSchema,
    maxTokens: MAX_TOKENS,
    retries: RETRIES,
  });
}

export type { GeneratePlanInput } from "./prompt";
