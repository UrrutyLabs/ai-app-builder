import { FeatureSpecSchema, type FeatureSpec } from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type GenerateSpecInput,
} from "./prompt";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 4096;
const RETRIES = 1;

export async function generateSpec(
  input: GenerateSpecInput,
): Promise<FeatureSpec> {
  return runToolUse({
    step: "generate-spec",
    model: MODELS.spec,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_feature_spec",
    toolDescription:
      "Record the structured feature spec derived from the user's idea and Q&A.",
    outputSchema: FeatureSpecSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    retries: RETRIES,
  });
}

export type { GenerateSpecInput } from "./prompt";
