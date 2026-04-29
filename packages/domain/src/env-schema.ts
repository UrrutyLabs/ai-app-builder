import { z } from "zod";

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[A-Za-z0-9+/]{43}=$/, "Must be 32 bytes (44-char base64)"),
  AI_MODEL_QUESTIONS: z.string().optional(),
  AI_MODEL_SPEC: z.string().optional(),
  AI_MODEL_PLAN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
