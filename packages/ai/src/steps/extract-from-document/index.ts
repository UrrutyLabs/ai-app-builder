import {
  DocumentExtractionSchema,
  type DocumentExtraction,
} from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type ExtractFromDocumentInput,
} from "./prompt";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 2048;
const RETRIES = 1;

export async function extractFromDocument(
  input: ExtractFromDocumentInput,
): Promise<DocumentExtraction> {
  return runToolUse({
    step: "extract-from-document",
    model: MODELS.spec,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_document_extraction",
    toolDescription:
      "Record the feature title, idea, decisions, constraints, open questions, and any other features detected in a product document.",
    outputSchema: DocumentExtractionSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    retries: RETRIES,
  });
}

export type { ExtractFromDocumentInput } from "./prompt";
