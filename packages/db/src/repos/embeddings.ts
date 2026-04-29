import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export interface EmbeddingInput {
  path: string;
  content: string;
  embedding: number[];
}

export interface SimilarFile {
  path: string;
  content: string;
  similarity: number;
}

function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

/**
 * Replace all embeddings for a given repo. Used on every connect/refresh —
 * simpler than diffing, and indexing is bounded by MAX_FILES_TO_EMBED anyway.
 */
export async function replaceRepoEmbeddings(
  repoId: string,
  items: EmbeddingInput[],
): Promise<number> {
  await prisma.$executeRaw`DELETE FROM "RepoFileEmbedding" WHERE "repoId" = ${repoId}`;
  if (items.length === 0) return 0;

  let inserted = 0;
  for (const item of items) {
    const id = crypto.randomUUID();
    const literal = vectorLiteral(item.embedding);
    await prisma.$executeRaw`
      INSERT INTO "RepoFileEmbedding" ("id", "repoId", "path", "content", "embedding", "updatedAt")
      VALUES (${id}, ${repoId}, ${item.path}, ${item.content}, ${literal}::vector, NOW())
    `;
    inserted++;
  }
  return inserted;
}

/** Cosine-similarity search; returns top-K rows. */
export async function searchSimilarFiles(
  repoId: string,
  queryEmbedding: number[],
  k: number,
): Promise<SimilarFile[]> {
  const literal = vectorLiteral(queryEmbedding);
  const rows = await prisma.$queryRaw<
    Array<{ path: string; content: string; similarity: number }>
  >`
    SELECT "path", "content",
           1 - ("embedding" <=> ${literal}::vector) AS similarity
    FROM "RepoFileEmbedding"
    WHERE "repoId" = ${repoId}
    ORDER BY "embedding" <=> ${literal}::vector
    LIMIT ${Prisma.raw(String(Math.max(1, Math.floor(k))))}
  `;
  return rows;
}

/** Quick count for UI indicators. */
export async function countRepoEmbeddings(repoId: string): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "RepoFileEmbedding"
    WHERE "repoId" = ${repoId}
  `;
  const first = result[0];
  return first ? Number(first.count) : 0;
}
