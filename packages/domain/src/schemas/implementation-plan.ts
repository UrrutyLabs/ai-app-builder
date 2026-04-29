import { z } from "zod";

export const AffectedAreaSchema = z.enum([
  "frontend",
  "backend",
  "database",
  "infrastructure",
  "docs",
  "tests",
]);

export const FileChangeSchema = z.object({
  path: z.string().min(1),
  action: z.enum(["create", "modify", "delete"]),
  summary: z.string().min(1),
});

export const ImplementationStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  area: AffectedAreaSchema,
});

export const RiskSchema = z.object({
  description: z.string().min(1),
  mitigation: z.string().min(1),
});

export const ImplementationPlanSchema = z.object({
  summary: z.string().min(1),
  affectedAreas: z.array(AffectedAreaSchema).min(1),
  fileChanges: z.array(FileChangeSchema),
  steps: z.array(ImplementationStepSchema).min(1),
  testPlan: z.array(z.string().min(1)).min(1),
  risks: z.array(RiskSchema).min(1),
});

export type AffectedArea = z.infer<typeof AffectedAreaSchema>;
export type FileChange = z.infer<typeof FileChangeSchema>;
export type ImplementationStep = z.infer<typeof ImplementationStepSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;
