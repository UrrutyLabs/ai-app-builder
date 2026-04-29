/**
 * Format retrieved file snippets for injection into LLM prompts.
 * Each snippet gets truncated and prefixed with its path.
 */
const PER_SNIPPET_CHAR_CAP = 3000;

export interface CodeSnippet {
  path: string;
  content: string;
  similarity?: number;
}

export function renderSnippets(snippets: CodeSnippet[]): string {
  if (snippets.length === 0) return "";

  const blocks = snippets.map((s) => {
    const trimmed =
      s.content.length > PER_SNIPPET_CHAR_CAP
        ? s.content.slice(0, PER_SNIPPET_CHAR_CAP) + "\n[...truncated]"
        : s.content;
    return `--- ${s.path} ---\n${trimmed}`;
  });

  return [
    `Code context (top ${snippets.length} files most relevant to the idea):`,
    "",
    ...blocks,
  ].join("\n");
}
