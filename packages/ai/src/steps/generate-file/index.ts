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
import { applyEdits } from "./apply-edits";
import { callEditsOnce } from "./edits";

const TEMPERATURE = 0.2;
const MAX_TOKENS = 8192;
const SDK_RETRIES = 1;
/** Files larger than this (chars) switch to SEARCH/REPLACE for modify actions
 *  to keep the LLM's output bounded. */
const LARGE_FILE_THRESHOLD = 6000;

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
  /** True if any repair attempt was made. */
  repaired: boolean;
  /** Strategy used: "full" (rewrite) or "edits" (SEARCH/REPLACE). */
  strategy: "full" | "edits";
}

/**
 * Entry point. Picks a strategy based on the file change:
 *
 * - `modify` actions on files > LARGE_FILE_THRESHOLD chars use SEARCH/REPLACE
 *   (`generateFileViaEdits`) — the LLM's output is bounded by the size of
 *   the change, not the file.
 * - Everything else uses full-content generation (`generateFileViaFull`).
 */
export async function generateFile(
  input: GenerateFileInput,
): Promise<GeneratedFile> {
  const isLargeModify =
    input.fileChange.action === "modify" &&
    input.existingContent != null &&
    input.existingContent.length > LARGE_FILE_THRESHOLD;

  if (isLargeModify) {
    return generateFileViaEdits(input);
  }
  return generateFileViaFull(input);
}

/**
 * Full-content path with parse-check + typecheck repair loops.
 * Up to two independent repair attempts (one for parse, one for typecheck).
 */
async function generateFileViaFull(
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

  if (!parseResult.ok) {
    return {
      path,
      content,
      verified: false,
      verifyError: parseResult.error,
      repaired,
      strategy: "full",
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

  return {
    path,
    content,
    verified: typeResult.ok,
    verifyError: typeResult.ok ? null : typeResult.errors.join("\n"),
    repaired,
    strategy: "full",
  };
}

/**
 * SEARCH/REPLACE path for large modify actions:
 *   1. Ask the LLM for edits.
 *   2. Apply edits deterministically. If any fail to apply, retry once with
 *      failure details.
 *   3. Verify (parse + type). No further repair — the reviewer sees the diff
 *      and any verification callouts in the PR body.
 */
async function generateFileViaEdits(
  input: GenerateFileInput,
): Promise<GeneratedFile> {
  const path = input.fileChange.path;
  // Caller invariant: existingContent is set for large modifies.
  const existing = input.existingContent ?? "";

  const editsInput = {
    featureTitle: input.featureTitle,
    featureIdea: input.featureIdea,
    spec: input.spec,
    fileChange: input.fileChange,
    existingContent: existing,
    conventionsContext: input.conventionsContext ?? null,
    codeContext: input.codeContext ?? null,
    previousFiles: input.previousFiles,
  };

  let edits = await callEditsOnce(editsInput);
  let result = applyEdits(existing, edits);
  let repaired = false;

  // If any edit failed to apply, retry once with the failures fed back.
  if (result.failures.length > 0) {
    try {
      edits = await callEditsOnce({
        ...editsInput,
        retryFailures: result.failures,
      });
      const retried = applyEdits(existing, edits);
      // Take the retry only if it strictly improved things.
      if (retried.failures.length < result.failures.length) {
        result = retried;
      }
      repaired = true;
    } catch {
      // Keep first attempt.
    }
  }

  const editFailureMessage =
    result.failures.length > 0
      ? `Edit application failures (${result.failures.length}):\n${result.failures
          .map((f) => `- ${f.reason}`)
          .join("\n")}`
      : null;

  const parseResult = verifySyntax(path, result.content);
  const typeResult = parseResult.ok
    ? typecheck(path, result.content, input.previousFiles)
    : { ok: true, errors: [] as string[] };

  const errorParts: string[] = [];
  if (editFailureMessage) errorParts.push(editFailureMessage);
  if (!parseResult.ok && parseResult.error)
    errorParts.push(`Parse error: ${parseResult.error}`);
  if (!typeResult.ok && typeResult.errors.length > 0)
    errorParts.push(`Type errors:\n${typeResult.errors.join("\n")}`);

  const verified =
    result.failures.length === 0 && parseResult.ok && typeResult.ok;

  return {
    path,
    content: result.content,
    verified,
    verifyError: errorParts.length > 0 ? errorParts.join("\n\n") : null,
    repaired,
    strategy: "edits",
  };
}

export type { GenerateFileInput } from "./prompt";
