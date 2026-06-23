import { z } from "zod";

/** Text MIME types accepted in v1. No binary formats yet. */
export const ContextDocMimeTypeSchema = z.enum(["text/markdown", "text/plain"]);

export type ContextDocMimeType = z.infer<typeof ContextDocMimeTypeSchema>;

export const UploadContextDocInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  // ~500 KB of text. Bounds storage + embedding cost.
  content: z.string().min(1).max(500_000),
  mimeType: ContextDocMimeTypeSchema,
});

export type UploadContextDocInput = z.infer<typeof UploadContextDocInputSchema>;

export const DeleteContextDocInputSchema = z.object({
  docId: z.string().min(1),
});

export type DeleteContextDocInput = z.infer<typeof DeleteContextDocInputSchema>;
