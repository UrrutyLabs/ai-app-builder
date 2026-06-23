import type { ProjectContextDoc as PrismaContextDoc } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export type ProjectContextDocRecord = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  mimeType: string;
  byteLength: number;
  createdAt: Date;
  updatedAt: Date;
};

const toRecord = (d: PrismaContextDoc): ProjectContextDocRecord => ({
  id: d.id,
  projectId: d.projectId,
  title: d.title,
  content: d.content,
  mimeType: d.mimeType,
  byteLength: d.byteLength,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export interface ContextDocEmbeddingInput {
  chunkIx: number;
  content: string;
  embedding: number[];
}

export interface SimilarDocChunk {
  docTitle: string;
  content: string;
  similarity: number;
}

function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

export async function createContextDoc(input: {
  projectId: string;
  title: string;
  content: string;
  mimeType: string;
}): Promise<ProjectContextDocRecord> {
  const row = await prisma.projectContextDoc.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      content: input.content,
      mimeType: input.mimeType,
      byteLength: Buffer.byteLength(input.content, "utf8"),
    },
  });
  return toRecord(row);
}

export async function listContextDocsByProjectId(
  projectId: string,
): Promise<ProjectContextDocRecord[]> {
  const rows = await prisma.projectContextDoc.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getContextDocById(
  id: string,
): Promise<ProjectContextDocRecord | null> {
  const row = await prisma.projectContextDoc.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function deleteContextDoc(id: string): Promise<void> {
  await prisma.projectContextDoc.delete({ where: { id } });
}

/**
 * Replace all embeddings for a doc. Mirrors replaceRepoEmbeddings — simpler
 * than diffing, and chunk count is bounded by MAX_CHUNKS_PER_DOC.
 */
export async function replaceContextDocEmbeddings(
  docId: string,
  items: ContextDocEmbeddingInput[],
): Promise<number> {
  await prisma.$executeRaw`DELETE FROM "ProjectContextDocEmbedding" WHERE "docId" = ${docId}`;
  if (items.length === 0) return 0;

  let inserted = 0;
  for (const item of items) {
    const id = crypto.randomUUID();
    const literal = vectorLiteral(item.embedding);
    await prisma.$executeRaw`
      INSERT INTO "ProjectContextDocEmbedding" ("id", "docId", "chunkIx", "content", "embedding", "updatedAt")
      VALUES (${id}, ${docId}, ${item.chunkIx}, ${item.content}, ${literal}::vector, NOW())
    `;
    inserted++;
  }
  return inserted;
}

/**
 * Cosine-similarity search across all context-doc chunks in a project.
 * Joins back to the parent doc for its title. Scoped by projectId — a doc in
 * project A is never returned for project B.
 */
export async function searchSimilarContextDocs(
  projectId: string,
  queryEmbedding: number[],
  k: number,
): Promise<SimilarDocChunk[]> {
  const literal = vectorLiteral(queryEmbedding);
  const rows = await prisma.$queryRaw<
    Array<{ docTitle: string; content: string; similarity: number }>
  >`
    SELECT d."title" AS "docTitle", e."content" AS "content",
           1 - (e."embedding" <=> ${literal}::vector) AS similarity
    FROM "ProjectContextDocEmbedding" e
    JOIN "ProjectContextDoc" d ON d."id" = e."docId"
    WHERE d."projectId" = ${projectId}
    ORDER BY e."embedding" <=> ${literal}::vector
    LIMIT ${Prisma.raw(String(Math.max(1, Math.floor(k))))}
  `;
  return rows;
}
