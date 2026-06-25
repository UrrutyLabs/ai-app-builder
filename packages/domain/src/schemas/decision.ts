import { z } from "zod";

/** One statement per row — keeps decisions atomic and bounds storage. */
const STATEMENT_MAX = 400;

// String literals match the Prisma enums exactly (Prisma returns these values).
export const DecisionKindSchema = z.enum([
  "DECISION",
  "CONSTRAINT",
  "OPEN_QUESTION",
]);
export type DecisionKind = z.infer<typeof DecisionKindSchema>;

export const DecisionStatusSchema = z.enum([
  "OPEN",
  "ACCEPTED",
  "SUPERSEDED",
  "REJECTED",
]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

export const DecisionSourceSchema = z.enum([
  "TRANSCRIPT",
  "CLARIFYING_ANSWER",
  "CONTEXT_DOC",
  "HUMAN_EDIT",
  "AI_PROPOSAL",
]);
export type DecisionSource = z.infer<typeof DecisionSourceSchema>;

/**
 * Insert shape for a Decision — `featureId` is supplied by the repo, not the
 * caller. `createdBy` is a user id, or "ai" for machine-distilled decisions.
 */
export const NewDecisionSchema = z.object({
  kind: DecisionKindSchema,
  status: DecisionStatusSchema,
  statement: z.string().min(1).max(STATEMENT_MAX),
  rationale: z.string().max(2000).nullable().optional(),
  sourceType: DecisionSourceSchema,
  sourceId: z.string().nullable().optional(),
  createdBy: z.string().min(1),
});

export type NewDecision = z.infer<typeof NewDecisionSchema>;
