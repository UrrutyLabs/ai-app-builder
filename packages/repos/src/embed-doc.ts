import { embedTexts } from "./embed";

/** Target chunk size in characters. ~1500 chars ≈ ~375 tokens. */
const CHUNK_TARGET_CHARS = 1500;
/** Overlap between consecutive chunks, in characters (~10%). */
const CHUNK_OVERLAP_CHARS = 150;
/** Upper bound on chunks per doc. Excess is truncated (logged by the caller). */
export const MAX_CHUNKS_PER_DOC = 100;

const EMBED_BATCH_SIZE = 64;

export interface DocChunk {
  chunkIx: number;
  content: string;
}

export interface EmbeddedDocChunk {
  chunkIx: number;
  content: string;
  embedding: number[];
}

/**
 * Split document text into overlapping chunks. Deliberately simple (v1):
 * split on blank lines into paragraphs, then greedily pack paragraphs into
 * ~CHUNK_TARGET_CHARS windows. A single oversized paragraph is hard-split.
 * Consecutive chunks share ~CHUNK_OVERLAP_CHARS of trailing text so a fact
 * that straddles a boundary survives retrieval.
 */
export function chunkDocContent(content: string): DocChunk[] {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim().length > 0) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    // A single paragraph larger than the target is hard-split on its own.
    if (para.length > CHUNK_TARGET_CHARS) {
      flush();
      for (let i = 0; i < para.length; i += CHUNK_TARGET_CHARS) {
        chunks.push(para.slice(i, i + CHUNK_TARGET_CHARS));
      }
      continue;
    }
    if (current.length + para.length + 2 > CHUNK_TARGET_CHARS) {
      flush();
    }
    current = current.length > 0 ? `${current}\n\n${para}` : para;
  }
  flush();

  // Apply overlap: prepend the tail of the previous chunk to each chunk.
  const withOverlap = chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const prev = chunks[i - 1]!;
    const overlap = prev.slice(Math.max(0, prev.length - CHUNK_OVERLAP_CHARS));
    return `${overlap}\n\n${chunk}`;
  });

  return withOverlap
    .slice(0, MAX_CHUNKS_PER_DOC)
    .map((content, chunkIx) => ({ chunkIx, content }));
}

/**
 * Chunk and embed a document's text. Returns one embedded chunk per chunk,
 * in order. Embedding failure propagates (caller decides whether to swallow).
 */
export async function embedDocContent(content: string): Promise<{
  chunks: EmbeddedDocChunk[];
  truncated: boolean;
}> {
  const rawChunks = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const allChunks = chunkDocContent(content);
  // truncated if the source produced more paragraphs than fit in MAX_CHUNKS.
  const truncated = rawChunks.length > 0 && allChunks.length >= MAX_CHUNKS_PER_DOC;

  const embedded: EmbeddedDocChunk[] = [];
  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((c) => c.content));
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = embeddings[j];
      if (chunk && embedding) {
        embedded.push({
          chunkIx: chunk.chunkIx,
          content: chunk.content,
          embedding,
        });
      }
    }
  }

  return { chunks: embedded, truncated };
}
