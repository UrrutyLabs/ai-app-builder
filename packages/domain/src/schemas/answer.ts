import { z } from "zod";

export const AnswerSchema = z.object({
  questionId: z.string().min(1),
  text: z.string().min(1),
});

export const AnswerListSchema = z.array(AnswerSchema);

export type Answer = z.infer<typeof AnswerSchema>;
