import type { FileTree } from "@repo/domain/schemas";
import { fetchFileContents } from "./fetch-files";
import type { GitHubRepoRef } from "./github";
import { embedTexts } from "./embed";

const MAX_FILES_TO_EMBED = 1000;
const BATCH_SIZE = 64;

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".scala",
  ".sql",
  ".prisma",
  ".graphql",
  ".vue",
  ".svelte",
  ".md",
  ".mdx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
]);

function isCodeFile(path: string): boolean {
  const dotIdx = path.lastIndexOf(".");
  if (dotIdx < 0) return false;
  return CODE_EXTENSIONS.has(path.slice(dotIdx).toLowerCase());
}

export interface IndexedFile {
  path: string;
  content: string;
  embedding: number[];
}

/**
 * Fetch source-file contents from a repo and embed each one.
 * Returns at most MAX_FILES_TO_EMBED files (those filtered to known code extensions,
 * sorted shortest-path-first to bias toward top-level/important files).
 */
export async function fetchAndEmbedRepoFiles({
  ref,
  token,
  fileTree,
}: {
  ref: GitHubRepoRef;
  token: string;
  fileTree: FileTree;
}): Promise<IndexedFile[]> {
  const candidates = fileTree.entries
    .filter((e) => e.type === "file" && isCodeFile(e.path))
    .sort((a, b) => a.path.length - b.path.length)
    .slice(0, MAX_FILES_TO_EMBED)
    .map((e) => e.path);

  if (candidates.length === 0) return [];

  const contents = await fetchFileContents({ ref, token, paths: candidates });

  const fetched: Array<{ path: string; content: string }> = [];
  for (const path of candidates) {
    const content = contents.get(path);
    if (content !== null && content !== undefined && content.trim().length > 0) {
      fetched.push({ path, content });
    }
  }

  const indexed: IndexedFile[] = [];
  for (let i = 0; i < fetched.length; i += BATCH_SIZE) {
    const batch = fetched.slice(i, i + BATCH_SIZE);
    const embeddings = await embedTexts(
      batch.map((f) => `# ${f.path}\n\n${f.content}`),
    );
    for (let j = 0; j < batch.length; j++) {
      const file = batch[j];
      const embedding = embeddings[j];
      if (file && embedding) {
        indexed.push({ path: file.path, content: file.content, embedding });
      }
    }
  }

  return indexed;
}
