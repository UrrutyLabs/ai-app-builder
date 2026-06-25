import { z } from "zod";
import { TranscriptContextSchema } from "./transcript-extraction";

/** Per-bullet length cap (mirrors the transcript extraction). */
const BULLET_MAX = 400;

/**
 * Full LLM output for the extract-from-document step. Reuses the structured
 * leftovers shape (decisions / constraints / openQuestions) and adds
 * `otherFeaturesDetected`: one-line summaries of *other* features the document
 * describes, which are surfaced to the user but NOT created (we make one
 * feature per document; segmentation is deferred).
 */
export const DocumentExtractionSchema = TranscriptContextSchema.extend({
  title: z.string().min(1).max(120),
  idea: z.string().min(1).max(2000),
  otherFeaturesDetected: z.array(z.string().min(1).max(BULLET_MAX)).max(20),
});

export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

/** Input for extractFromDocumentAction — the doc is an existing ProjectContextDoc. */
export const ExtractFromDocumentInputSchema = z.object({
  projectId: z.string().min(1),
  contextDocId: z.string().min(1),
});

export type ExtractFromDocumentInput = z.infer<
  typeof ExtractFromDocumentInputSchema
>;
