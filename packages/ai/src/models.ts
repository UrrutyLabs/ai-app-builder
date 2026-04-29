import { env } from "@repo/domain/env";

export const MODELS = {
  questions: env.AI_MODEL_QUESTIONS ?? "claude-haiku-4-5-20251001",
  spec: env.AI_MODEL_SPEC ?? "claude-sonnet-4-6",
  plan: env.AI_MODEL_PLAN ?? "claude-opus-4-7",
} as const;
