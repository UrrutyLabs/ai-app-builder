import type { Decision as PrismaDecision } from "@prisma/client";
import {
  NewDecisionSchema,
  type DecisionKind,
  type DecisionSource,
  type DecisionStatus,
  type NewDecision,
} from "@repo/domain/schemas";
import { prisma } from "../client";

export type DecisionRecord = {
  id: string;
  featureId: string;
  kind: DecisionKind;
  status: DecisionStatus;
  statement: string;
  rationale: string | null;
  sourceType: DecisionSource;
  sourceId: string | null;
  createdBy: string;
  createdAt: Date;
  decidedAt: Date | null;
};

const toRecord = (d: PrismaDecision): DecisionRecord => ({
  id: d.id,
  featureId: d.featureId,
  kind: d.kind,
  status: d.status,
  statement: d.statement,
  rationale: d.rationale,
  sourceType: d.sourceType,
  sourceId: d.sourceId,
  createdBy: d.createdBy,
  createdAt: d.createdAt,
  decidedAt: d.decidedAt,
});

/** Bulk-insert decisions for a feature. Inputs are validated before insert. */
export async function createDecisions(
  featureId: string,
  inputs: NewDecision[],
): Promise<number> {
  if (inputs.length === 0) return 0;
  const data = inputs.map((raw) => {
    const d = NewDecisionSchema.parse(raw);
    // Coerce optional → null for Prisma under exactOptionalPropertyTypes.
    return {
      featureId,
      kind: d.kind,
      status: d.status,
      statement: d.statement,
      rationale: d.rationale ?? null,
      sourceType: d.sourceType,
      sourceId: d.sourceId ?? null,
      createdBy: d.createdBy,
    };
  });
  const result = await prisma.decision.createMany({ data });
  return result.count;
}

export async function listDecisionsByFeature(
  featureId: string,
  opts?: { statuses?: DecisionStatus[] },
): Promise<DecisionRecord[]> {
  const rows = await prisma.decision.findMany({
    where: {
      featureId,
      ...(opts?.statuses ? { status: { in: opts.statuses } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function getDecisionById(
  id: string,
): Promise<DecisionRecord | null> {
  const row = await prisma.decision.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

/** Add a single decision (e.g. a human-authored one from the Decisions panel). */
export async function createDecision(
  featureId: string,
  input: NewDecision,
): Promise<DecisionRecord> {
  const d = NewDecisionSchema.parse(input);
  const row = await prisma.decision.create({
    data: {
      featureId,
      kind: d.kind,
      status: d.status,
      statement: d.statement,
      rationale: d.rationale ?? null,
      sourceType: d.sourceType,
      sourceId: d.sourceId ?? null,
      createdBy: d.createdBy,
      decidedAt: d.status === "OPEN" ? null : new Date(),
    },
  });
  return toRecord(row);
}

export async function setDecisionStatus(
  id: string,
  status: DecisionStatus,
): Promise<DecisionRecord> {
  const row = await prisma.decision.update({
    where: { id },
    data: { status, decidedAt: status === "OPEN" ? null : new Date() },
  });
  return toRecord(row);
}
