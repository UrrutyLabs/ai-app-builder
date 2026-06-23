import {
  TranscriptExtractionSchema,
  type TranscriptExtraction,
} from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type ExtractFromTranscriptInput,
} from "./prompt";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 2048;
const RETRIES = 1;

export async function extractFromTranscript(
  input: ExtractFromTranscriptInput,
): Promise<TranscriptExtraction> {
  return runToolUse({
    step: "extract-from-transcript",
    model: MODELS.spec,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_transcript_extraction",
    toolDescription:
      "Record the distilled feature title, idea, decisions, constraints, and open questions from a refinement transcript.",
    outputSchema: TranscriptExtractionSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    retries: RETRIES,
  });
}

export type { ExtractFromTranscriptInput } from "./prompt";
