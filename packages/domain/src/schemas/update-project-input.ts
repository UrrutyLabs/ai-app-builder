import { z } from "zod";

export const UpdateProjectInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullish(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;
