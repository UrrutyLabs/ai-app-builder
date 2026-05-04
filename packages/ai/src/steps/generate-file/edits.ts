import { z } from "zod";
import type { FeatureSpec, FileChange } from "@repo/domain/schemas";
import { MODELS } from "../../models";
import { runToolUse } from "../../tool-use";
import type { ApplyEditsResult, Edit } from "./apply-edits";

const EditSchema = z.object({
  search: z.string().min(1),
  replace: z.string(),
});

const EditsToolInputSchema = z.object({
  edits: z.array(EditSchema).min(1),
});

export interface GenerateEditsInput {
  featureTitle: string;
  featureIdea: string;
  spec: FeatureSpec;
  fileChange: FileChange;
  existingContent: string;
  conventionsContext?: string | null;
  codeContext?: string | null;
  previousFiles: Array<{ path: string; content: string }>;
  retryFailures?: ApplyEditsResult["failures"] | null;
}

export const EDITS_SYSTEM_PROMPT = `You are modifying a single source file. The file is too large to rewrite in full, so you'll output a list of SEARCH/REPLACE pairs that we'll apply deterministically.

Each pair has:
- search: an EXACT substring of the current file to be replaced (every character including whitespace, indentation, line endings)
- replace: the new content that takes its place (may be empty to delete)

Rules:
- Each \`search\` MUST appear EXACTLY in the current file. We do not fuzzy-match.
- Each \`search\` MUST be unique within the file. If the snippet appears more than once, include enough surrounding context (a few lines before and after) to make the match unambiguous.
- Only emit pairs for actual changes. No identity edits, no rewrites of unrelated regions.
- To INSERT a new block where there's nothing to replace, use a small surrounding context (e.g. an existing function definition or import line) as the \`search\` and include that context + the new code in the \`replace\`.
- Match the repo's existing conventions visible in the code context — don't invent new patterns.
- Tool input strings are plain text. Do NOT wrap content in markdown fences.`;

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

export function buildEditsUserPrompt(input: GenerateEditsInput): string {
  const specBlock = `Feature spec:
- Title: ${input.spec.title}
- Goal: ${input.spec.goal}
- Acceptance criteria:
${input.spec.acceptanceCriteria.map((c) => `  - ${c}`).join("\n")}`;

  const conventionsBlock = input.conventionsContext
    ? `\n\n${input.conventionsContext}`
    : "";
  const codeBlock = input.codeContext ? `\n\n${input.codeContext}` : "";
  const previousBlock =
    input.previousFiles.length === 0
      ? ""
      : `\n\nFiles already generated in this batch:\n${input.previousFiles
          .map((f) => `--- ${f.path} ---\n${f.content}`)
          .join("\n\n")}`;

  const retryBlock =
    input.retryFailures && input.retryFailures.length > 0
      ? `\n\n⚠️ Your previous edits failed to apply:\n${input.retryFailures
          .map((f) => `- ${f.reason}\n  search: ${truncate(f.search, 200)}`)
          .join("\n")}\n\nProduce edits whose search strings exactly match unique substrings of the current file.`
      : "";

  return `Feature: ${input.featureTitle}

${specBlock}${conventionsBlock}${codeBlock}${previousBlock}

File to modify (large — use SEARCH/REPLACE, not a full rewrite):
- Path: ${input.fileChange.path}
- Summary: ${input.fileChange.summary}

Current contents of \`${input.fileChange.path}\`:
--- ${input.fileChange.path} (current) ---
${input.existingContent}${retryBlock}

Emit your edits via the \`apply_edits\` tool.`;
}

const TEMPERATURE = 0.2;
const MAX_TOKENS = 8192;
const SDK_RETRIES = 1;

/** Single LLM call returning the raw edits. */
export async function callEditsOnce(input: GenerateEditsInput): Promise<Edit[]> {
  const result = await runToolUse({
    step: "generate-edits",
    model: MODELS.code,
    system: EDITS_SYSTEM_PROMPT,
    user: buildEditsUserPrompt(input),
    toolName: "apply_edits",
    toolDescription:
      "Output the list of SEARCH/REPLACE edits to apply to the current file.",
    outputSchema: EditsToolInputSchema,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
    retries: SDK_RETRIES,
  });
  return result.edits;
}

export type { ApplyEditsResult, Edit } from "./apply-edits";
