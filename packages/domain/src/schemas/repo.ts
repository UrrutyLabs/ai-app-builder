import { z } from "zod";

export const FileEntrySchema = z.object({
  path: z.string().min(1),
  type: z.enum(["file", "dir"]),
  size: z.number().int().nonnegative().optional(),
});

export const FileTreeSchema = z.object({
  truncated: z.boolean(),
  entries: z.array(FileEntrySchema),
});

export const ConnectRepoInputSchema = z.object({
  projectId: z.string().min(1),
  repoUrl: z.string().min(1).max(500),
  pat: z.string().min(1).max(500),
});

export type FileEntry = z.infer<typeof FileEntrySchema>;
export type FileTree = z.infer<typeof FileTreeSchema>;
export type ConnectRepoInput = z.infer<typeof ConnectRepoInputSchema>;
