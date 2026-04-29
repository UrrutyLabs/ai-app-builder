import { z } from "zod";

export const CreateFeatureInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(120),
  idea: z.string().min(1).max(2000),
});

export type CreateFeatureInput = z.infer<typeof CreateFeatureInputSchema>;
