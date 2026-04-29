import { z } from "zod";

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
  mode: z.enum(["greenfield", "existing_system"]),
  description: z.string().max(2000).nullish(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
