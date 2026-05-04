import type { SpecVersion as PrismaSpecVersion, Prisma } from "@prisma/client";
import {
  FeatureSpecSchema,
  type FeatureSpec,
} from "@repo/domain/schemas";
import { prisma } from "../client";

export type SpecVersionRecord = {
  id: string;
  featureId: string;
  spec: FeatureSpec;
  createdAt: Date;
};

const toRecord = (v: PrismaSpecVersion): SpecVersionRecord => ({
  id: v.id,
  featureId: v.featureId,
  spec: FeatureSpecSchema.parse(v.spec),
  createdAt: v.createdAt,
});

/**
 * Insert a new SpecVersion for a feature. Caller is responsible for ensuring
 * the spec was already validated (we re-validate just to be safe).
 */
export async function createSpecVersion(input: {
  featureId: string;
  spec: FeatureSpec;
}): Promise<SpecVersionRecord> {
  const validated = FeatureSpecSchema.parse(input.spec);
  const row = await prisma.specVersion.create({
    data: {
      featureId: input.featureId,
      spec: validated as Prisma.InputJsonValue,
    },
  });
  return toRecord(row);
}

/** Newest first. */
export async function listSpecVersionsByFeatureId(
  featureId: string,
): Promise<SpecVersionRecord[]> {
  const rows = await prisma.specVersion.findMany({
    where: { featureId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function countSpecVersionsByFeatureId(
  featureId: string,
): Promise<number> {
  return prisma.specVersion.count({ where: { featureId } });
}
