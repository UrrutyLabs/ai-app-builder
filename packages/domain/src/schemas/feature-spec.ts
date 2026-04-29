import { z } from "zod";

export const FeatureSpecSchema = z.object({
  title: z.string().min(1),
  problem: z.string().min(1),
  goal: z.string().min(1),
  mode: z.enum(["greenfield", "existing_system"]),
  scope: z.object({
    in: z.array(z.string()),
    out: z.array(z.string()),
  }),
  actors: z.array(z.string()),
  userFlows: z.array(z.string()),
  uiStates: z.array(z.string()),
  businessRules: z.array(z.string()),
  dataChanges: z.array(z.string()),
  apiChanges: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  assumptions: z.array(z.string()),
  openQuestions: z.array(z.string()),
});

export type FeatureSpec = z.infer<typeof FeatureSpecSchema>;
