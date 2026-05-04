import { z } from "zod";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type GenerateFileInput,
} from "./prompt";
import { verifySyntax } from "./verify";
import { typecheck } from "./typecheck";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 8192;
const SDK_RETRIES = 1;

const ToolInputSchema = z.object({
  content: z.string().min(1),
});

async function callOnce(input: GenerateFileInput): Promise<string> {
  const result = await runToolUse({
    step: "generate-file",
    model: MODELS.code,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    toolName: "record_file_content",
    toolDescription:
      "Record the full content of the requested source file. Output plain file content (no markdown fences).",
    outputSchema: ToolInputSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    retries: SDK_RETRIES,
  });
  return result.content;
}

export interface GeneratedFile {
  path: string;
  content: string;
  /** True if the file passed (or was not subject to) parse-check AND typecheck. */
  verified: boolean;
  /** Combined error message when verification failed; null otherwise. */
  verifyError: string | null;
  /** True if any repair attempt was made (parse OR typecheck). */
  repaired: boolean;
}

/**
 * Generate one file with up to two independent repair attempts:
 *   1. Initial generation
 *   2. If parse-check fails: repair attempt with parser error
 *   3. If typecheck fails (only run when parse-check passes): repair attempt
 *      with TS diagnostics
 *
 * Each repair is bounded to one attempt. If a check still fails after repair,
 * we keep whichever candidate is best and return verified=false (the reviewer
 * sees the issue in the PR diff plus a callout in the PR body).
 */
export async function generateFile(
  input: GenerateFileInput,
): Promise<GeneratedFile> {
  const path = input.fileChange.path;
  let content = await callOnce(input);
  let parseResult = verifySyntax(path, content);
  let repaired = false;

  // ── Parse-check repair (if needed) ─────────────────────────────────────
  if (!parseResult.ok) {
    try {
      const candidate = await callOnce({
        ...input,
        retryReason: "parse",
        retryError: parseResult.error,
        retryAttempt: content,
      });
      content = candidate;
      parseResult = verifySyntax(path, candidate);
      repaired = true;
    } catch {
      // Repair call failed — keep the original; verified stays false.
    }
  }

  // If parse still fails, don't even try typecheck (the compiler would just
  // surface the same syntax error).
  if (!parseResult.ok) {
    return {
      path,
      content,
      verified: false,
      verifyError: parseResult.error,
      repaired,
    };
  }

  // ── Typecheck repair (if needed) ───────────────────────────────────────
  let typeResult = typecheck(path, content, input.previousFiles);

  if (!typeResult.ok) {
    try {
      const candidate = await callOnce({
        ...input,
        retryReason: "typecheck",
        retryError: typeResult.errors.join("\n"),
        retryAttempt: content,
      });
      const candidateParse = verifySyntax(path, candidate);
      if (candidateParse.ok) {
        const candidateType = typecheck(path, candidate, input.previousFiles);
        // Take the candidate if it strictly improved (or fixed) the errors.
        if (
          candidateType.ok ||
          candidateType.errors.length < typeResult.errors.length
        ) {
          content = candidate;
          typeResult = candidateType;
        }
      }
      repaired = true;
    } catch {
      // Repair call failed — keep current.
    }
  }

  const verified = parseResult.ok && typeResult.ok;
  const verifyError = !typeResult.ok ? typeResult.errors.join("\n") : null;

  return {
    path,
    content,
    verified,
    verifyError,
    repaired,
  };
}

export type { GenerateFileInput } from "./prompt";
