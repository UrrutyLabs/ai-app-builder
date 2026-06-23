import {
  getRepoByProjectId,
  searchSimilarContextDocs,
  searchSimilarFiles,
} from "@repo/db";
import {
  renderDocSnippets,
  renderSnippets,
  type DocSnippet,
} from "@repo/repos";
import { embedQuery } from "@repo/repos/server";

const DEFAULT_K_FILES = 8;
const DEFAULT_K_DOCS = 4;

export interface RetrievedContext {
  /** Rendered code-snippet block, or null when no repo / no matches. */
  codeContext: string | null;
  /** Rendered project-document block, or null when no docs / no matches. */
  docsContext: string | null;
}

/**
 * Unified project-level retrieval. Embeds the query once, then searches both
 * the connected repo's file embeddings and the project's context-doc
 * embeddings in parallel. Either source may be empty; both blocks are null
 * when nothing matches. Replaces the ad-hoc `searchSimilarFiles` calls that
 * each step used to make on its own.
 */
export async function retrieveProjectContext({
  projectId,
  query,
  kFiles = DEFAULT_K_FILES,
  kDocs = DEFAULT_K_DOCS,
}: {
  projectId: string;
  query: string;
  kFiles?: number;
  kDocs?: number;
}): Promise<RetrievedContext> {
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(query.slice(0, 6000));
  } catch (err) {
    console.error("[retrieveProjectContext] query embedding failed:", err);
    return { codeContext: null, docsContext: null };
  }

  const repo = await getRepoByProjectId(projectId);

  const [codeSnippets, docChunks] = await Promise.all([
    repo
      ? searchSimilarFiles(repo.id, queryEmbedding, kFiles).catch((err) => {
          console.error("[retrieveProjectContext] file search failed:", err);
          return [];
        })
      : Promise.resolve([]),
    searchSimilarContextDocs(projectId, queryEmbedding, kDocs).catch((err) => {
      console.error("[retrieveProjectContext] doc search failed:", err);
      return [];
    }),
  ]);

  const codeContext =
    codeSnippets.length > 0 ? renderSnippets(codeSnippets) : null;

  const docSnippets: DocSnippet[] = docChunks.map((c) => ({
    docTitle: c.docTitle,
    content: c.content,
    similarity: c.similarity,
  }));
  const docsContext =
    docSnippets.length > 0 ? renderDocSnippets(docSnippets) : null;

  return { codeContext, docsContext };
}
