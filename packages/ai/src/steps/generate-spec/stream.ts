import { FeatureSpecSchema, type FeatureSpec } from "@repo/domain/schemas";
import { LlmError } from "@repo/domain";
import { zodToJsonSchema } from "zod-to-json-schema";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../../client";
import { MODELS } from "../../models";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type GenerateSpecInput,
} from "./prompt";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 4096;
const TOOL_NAME = "record_feature_spec";

export type SpecStreamEvent =
  | { kind: "snapshot"; snapshot: unknown }
  | { kind: "complete"; spec: FeatureSpec }
  | { kind: "error"; message: string };

/**
 * Stream a FeatureSpec from the LLM. The Anthropic SDK gives us
 * `inputJson(partialJson, jsonSnapshot)` — `jsonSnapshot` is the running
 * partial-parsed object, which we forward so the client can render
 * fields as they materialize.
 */
export async function* generateSpecStream(
  input: GenerateSpecInput,
): AsyncGenerator<SpecStreamEvent, void, void> {
  const inputSchema = zodToJsonSchema(FeatureSpecSchema, {
    target: "openApi3",
  }) as Anthropic.Tool["input_schema"];

  // Snapshots arrive from an event listener; we queue them so the async
  // generator can yield them in order without dropping any.
  const queue: SpecStreamEvent[] = [];
  let waiter: (() => void) | null = null;
  const wake = () => {
    if (waiter) {
      waiter();
      waiter = null;
    }
  };

  const stream = anthropic.messages.stream({
    model: MODELS.spec,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Record the structured feature spec derived from the user's idea and Q&A.",
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  stream.on("inputJson", (_partial, snapshot) => {
    queue.push({ kind: "snapshot", snapshot });
    wake();
  });

  const finalPromise = stream
    .finalMessage()
    .then((msg) => {
      const block = msg.content.find((c) => c.type === "tool_use");
      if (!block || block.type !== "tool_use" || block.name !== TOOL_NAME) {
        throw new LlmError(
          `Expected tool_use response from generate-spec stream, got: ${JSON.stringify(msg.content)}`,
        );
      }
      const parsed = FeatureSpecSchema.safeParse(block.input);
      if (!parsed.success) {
        throw new LlmError(
          `Streamed tool output failed schema validation: ${parsed.error.message}`,
        );
      }
      queue.push({ kind: "complete", spec: parsed.data });
    })
    .catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Unknown streaming error";
      queue.push({ kind: "error", message });
    })
    .finally(() => {
      wake();
    });

  let done = false;
  while (!done) {
    while (queue.length > 0) {
      const event = queue.shift()!;
      yield event;
      if (event.kind === "complete" || event.kind === "error") done = true;
    }
    if (done) break;
    await new Promise<void>((resolve) => {
      waiter = resolve;
    });
  }

  await finalPromise;
}
