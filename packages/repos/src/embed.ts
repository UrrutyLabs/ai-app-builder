import OpenAI from "openai";
import { AppError } from "@repo/domain";
import { env } from "@repo/domain/env";

const MODEL = "text-embedding-3-small";
const DIMS = 1536;

let _client: OpenAI | undefined;
function client(): OpenAI {
  _client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
}

/** Per-input character cap. ~6000 chars ≈ ~1500 tokens, well under the 8191 limit. */
const MAX_INPUT_CHARS = 6000;

function truncate(text: string): string {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return text.slice(0, MAX_INPUT_CHARS) + "\n\n[...truncated]";
}

/** Embed a batch of texts. Returns one vector per input, in order. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const truncated = texts.map(truncate);
  try {
    const response = await client().embeddings.create({
      model: MODEL,
      input: truncated,
    });
    return response.data.map((d) => d.embedding);
  } catch (err) {
    throw new AppError("OPENAI", "Embedding request failed", err);
  }
}

/** Embed a single query string for retrieval. */
export async function embedQuery(text: string): Promise<number[]> {
  const [first] = await embedTexts([text]);
  if (!first) throw new AppError("OPENAI", "No embedding returned");
  return first;
}

export const EMBEDDING_MODEL = MODEL;
export const EMBEDDING_DIMS = DIMS;
