import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const QuestionListSchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
