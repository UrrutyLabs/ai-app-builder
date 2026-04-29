import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { LlmError } from "@repo/domain";
import { anthropic } from "./client";

export interface ToolUseRequest<T extends z.ZodTypeAny> {
  step: string;
  model: string;
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  outputSchema: T;
  /**
   * Optional. Some newer models (e.g. Opus 4.7) deprecated the temperature
   * parameter and reject calls that pass it.
   */
  temperature?: number;
  maxTokens: number;
  /**
   * Retry once on LlmError. 0 = no retry (default), 1 = one retry.
   * Higher values are not supported — for v0.1 we either retry once or fail.
   */
  retries?: 0 | 1;
}

export async function runToolUse<T extends z.ZodTypeAny>(
  req: ToolUseRequest<T>,
): Promise<z.infer<T>> {
  try {
    return await runToolUseOnce(req);
  } catch (err) {
    if (req.retries === 1 && err instanceof LlmError) {
      return await runToolUseOnce(req);
    }
    throw err;
  }
}

async function runToolUseOnce<T extends z.ZodTypeAny>(
  req: ToolUseRequest<T>,
): Promise<z.infer<T>> {
  // zod-to-json-schema returns a JSON Schema; for z.object(...) it's structurally
  // compatible with Anthropic's Tool.input_schema, but the TS types don't align.
  const inputSchema = zodToJsonSchema(req.outputSchema, {
    target: "openApi3",
  }) as Anthropic.Tool["input_schema"];

  let response: Anthropic.Messages.Message;
  try {
    response = await anthropic.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      system: req.system,
      tools: [
        {
          name: req.toolName,
          description: req.toolDescription,
          input_schema: inputSchema,
        },
      ],
      tool_choice: { type: "tool", name: req.toolName },
      messages: [{ role: "user", content: req.user }],
    });
  } catch (err) {
    throw new LlmError(`Anthropic call failed in ${req.step}`, err);
  }

  const block = response.content.find((c) => c.type === "tool_use");
  if (!block || block.type !== "tool_use" || block.name !== req.toolName) {
    throw new LlmError(
      `Expected tool_use response from ${req.step}, got: ${JSON.stringify(
        response.content,
      )}`,
    );
  }

  const parsed = req.outputSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new LlmError(
      `Tool output failed schema validation in ${req.step}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
