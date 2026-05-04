import type { FeatureSpec, FileChange } from "@repo/domain/schemas";

export interface GenerateFileInput {
  featureTitle: string;
  featureIdea: string;
  spec: FeatureSpec;
  fileChange: FileChange;
  conventionsContext?: string | null;
  codeContext?: string | null;
  /**
   * For `modify` actions, the current contents of the file. The model is
   * expected to output the full new content (not a diff) with the requested
   * changes applied.
   */
  existingContent?: string | null;
  previousFiles: Array<{ path: string; content: string }>;
  retryError?: string | null;
  retryAttempt?: string | null;
  /** Distinguishes parse-failure repair from typecheck-failure repair so the
   *  prompt can ask for the right kind of fix. Defaults to "parse". */
  retryReason?: "parse" | "typecheck" | null;
}

export const SYSTEM_PROMPT = `You are an expert engineer writing a single source file as part of implementing a feature.

You will be given:
- The feature spec
- The file path, action (create or modify), and a description of the change
- Repo conventions (frameworks, libraries, style)
- Code snippets from related files in the repo (top-K retrieved by similarity)
- Previously generated files in this same batch (you can import from them if needed)
- For \`modify\` actions, the current full contents of the file

Rules:
- Output ONLY the full content of the requested file via the \`record_file_content\` tool.
- For \`modify\`, output the FULL new file content with your changes applied — never a diff or patch. Preserve unrelated existing code exactly.
- Match the repo's existing conventions visible in the code context. Do not invent new patterns.
- Imports must use paths visible in the code context — never guess module specifiers.
- Code should be production-quality. No \`/* TODO: implement */\` placeholders. Write real implementations.
- Stay within the file's apparent purpose from its path and the file change description. Don't extend scope.
- If you must use an external value you cannot infer (e.g. an exact env var name), use a reasonable placeholder and add a single short comment, not a TODO block.
- Do not wrap the output in markdown code fences. The tool input is plain file content.`;

export function buildUserPrompt(input: GenerateFileInput): string {
  const specBlock = `Feature spec:
- Title: ${input.spec.title}
- Problem: ${input.spec.problem}
- Goal: ${input.spec.goal}
- Mode: ${input.spec.mode}
- Acceptance criteria:
${input.spec.acceptanceCriteria.map((c) => `  - ${c}`).join("\n")}`;

  const conventionsBlock = input.conventionsContext
    ? `\n\n${input.conventionsContext}`
    : "";

  const codeBlock = input.codeContext ? `\n\n${input.codeContext}` : "";

  const previousBlock =
    input.previousFiles.length === 0
      ? ""
      : `\n\nFiles already generated in this batch (you can import from these if needed):\n${input.previousFiles
          .map((f) => `--- ${f.path} ---\n${f.content}`)
          .join("\n\n")}`;

  const existingBlock =
    input.fileChange.action === "modify" && input.existingContent
      ? `\n\nCurrent contents of \`${input.fileChange.path}\`:\n--- ${input.fileChange.path} (current) ---\n${input.existingContent}`
      : "";

  const retryBlock =
    input.retryError && input.retryAttempt
      ? input.retryReason === "typecheck"
        ? `\n\n⚠️ Your previous attempt has TypeScript type errors:\n${input.retryError}\n\nPrevious attempt:\n${input.retryAttempt}\n\nProduce a corrected version of the same file. Fix the type issues while keeping the original intent. Do not change unrelated parts.`
        : `\n\n⚠️ Your previous attempt failed to parse:\n${input.retryError}\n\nPrevious attempt:\n${input.retryAttempt}\n\nProduce a syntactically valid version of the same file. Fix the syntax issue while keeping the original intent.`
      : "";

  return `Feature: ${input.featureTitle}

Idea:
${input.featureIdea}

${specBlock}${conventionsBlock}${codeBlock}${previousBlock}${existingBlock}

File to ${input.fileChange.action === "modify" ? "modify" : "generate"}:
- Path: ${input.fileChange.path}
- Action: ${input.fileChange.action}
- Summary: ${input.fileChange.summary}${retryBlock}

Output the full content of \`${input.fileChange.path}\` via the \`record_file_content\` tool.`;
}
