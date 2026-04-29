import { z } from "zod";
import { QuestionListSchema, type Question } from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type GenerateQuestionsInput,
} from "./prompt";

const TEMPERATURE = 0.5;
const MAX_TOKENS = 2048;

const ToolInputSchema = z.object({
  questions: QuestionListSchema,
});

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<Question[]> {
  const result = await runToolUse({
    step: "generate-questions",
    model: MODELS.questions,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_questions",
    toolDescription:
      "Record the list of clarifying questions to ask the user before generating the feature spec.",
    outputSchema: ToolInputSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  });
  return result.questions;
}

export type { GenerateQuestionsInput } from "./prompt";
