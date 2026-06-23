import { z } from "zod";

/**
 * Per-bullet length cap. Keeps the LLM honest (one decision/constraint per
 * bullet, not a paragraph) and bounds storage size.
 */
const BULLET_MAX = 400;

/**
 * What we persist on Feature.transcriptContext — the structured leftovers
 * after the LLM has lifted out `title` and `idea` into the Feature record.
 * These seed the spec's assumptions / openQuestions and ground the
 * generate-questions and generate-spec prompts.
 */
export const TranscriptContextSchema = z.object({
  decisions: z.array(z.string().min(1).max(BULLET_MAX)).max(50),
  constraints: z.array(z.string().min(1).max(BULLET_MAX)).max(50),
  openQuestions: z.array(z.string().min(1).max(BULLET_MAX)).max(50),
});

export type TranscriptContext = z.infer<typeof TranscriptContextSchema>;

/**
 * Full LLM output for the extract-from-transcript step. `title` + `idea`
 * become Feature.title / Feature.idea; the rest is TranscriptContext.
 */
export const TranscriptExtractionSchema = TranscriptContextSchema.extend({
  title: z.string().min(1).max(120),
  idea: z.string().min(1).max(2000),
});

export type TranscriptExtraction = z.infer<typeof TranscriptExtractionSchema>;

/** Input for extractFromTranscriptAction — paste-only v1. */
export const ExtractFromTranscriptInputSchema = z.object({
  projectId: z.string().min(1),
  transcript: z.string().min(20).max(50_000),
});

export type ExtractFromTranscriptInput = z.infer<
  typeof ExtractFromTranscriptInputSchema
>;
