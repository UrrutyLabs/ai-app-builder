import type { Project as PrismaProject } from "@prisma/client";
import { Mode } from "@prisma/client";
import { prisma } from "../client";

export type DomainMode = "greenfield" | "existing_system";

export type ProjectRecord = {
  id: string;
  userId: string | null;
  organizationId: string | null;
  name: string;
  mode: DomainMode;
  description: string | null;
  specPath: string | null;
  planPath: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Where-clause for "projects the user may see": those in their active org, plus
 * legacy rows they own that haven't been migrated to an org yet. With no active
 * org (mid-bootstrap), only the legacy rows. Keeps projects visible throughout
 * the single-user → org migration.
 */
function scopeWhere(userId: string, organizationId: string | null) {
  return organizationId
    ? {
        OR: [{ organizationId }, { organizationId: null, userId }],
      }
    : { organizationId: null, userId };
}

const toDomainMode = (m: Mode): DomainMode =>
  m === Mode.GREENFIELD ? "greenfield" : "existing_system";

const toPrismaMode = (m: DomainMode): Mode =>
  m === "greenfield" ? Mode.GREENFIELD : Mode.EXISTING_SYSTEM;

const toRecord = (p: PrismaProject): ProjectRecord => ({
  id: p.id,
  userId: p.userId,
  organizationId: p.organizationId,
  name: p.name,
  mode: toDomainMode(p.mode),
  description: p.description,
  specPath: p.specPath,
  planPath: p.planPath,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export async function createProject(input: {
  userId: string;
  organizationId: string | null;
  name: string;
  mode: DomainMode;
  description?: string | null;
}): Promise<ProjectRecord> {
  const row = await prisma.project.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      name: input.name,
      mode: toPrismaMode(input.mode),
      description: input.description ?? null,
    },
  });
  return toRecord(row);
}

/** Projects visible to the user in their active org (plus legacy rows they own). */
export async function listProjectsForUser(
  userId: string,
  organizationId: string | null,
): Promise<ProjectRecord[]> {
  const rows = await prisma.project.findMany({
    where: scopeWhere(userId, organizationId),
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

/**
 * Fetch a project by id, scoped to the user's active org (with legacy fallback).
 * Returns null for both missing and unowned projects — never leak existence by
 * distinguishing 404 vs 403.
 */
export async function getProjectForUser(
  id: string,
  userId: string,
  organizationId: string | null,
): Promise<ProjectRecord | null> {
  const row = await prisma.project.findFirst({
    where: { id, ...scopeWhere(userId, organizationId) },
  });
  return row ? toRecord(row) : null;
}

/** Assign the user's not-yet-migrated projects to their active org. Returns count. */
export async function claimLegacyProjectsForUser(
  userId: string,
  organizationId: string,
): Promise<number> {
  const result = await prisma.project.updateMany({
    where: { userId, organizationId: null },
    data: { organizationId },
  });
  return result.count;
}

/** Internal: fetch by id with no user scoping. Use only when userId is unknown
 *  (e.g. claim-orphans flow). Never expose to user-facing actions. */
export async function getProjectByIdUnscoped(
  id: string,
): Promise<ProjectRecord | null> {
  const row = await prisma.project.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function updateProject(input: {
  id: string;
  userId: string;
  organizationId: string | null;
  name: string;
  description?: string | null;
}): Promise<ProjectRecord> {
  // Scoped fetch first (org membership or legacy ownership), then update by id.
  const existing = await prisma.project.findFirst({
    where: { id: input.id, ...scopeWhere(input.userId, input.organizationId) },
    select: { id: true },
  });
  if (!existing) throw new Error("Project not found or not accessible");
  const row = await prisma.project.update({
    where: { id: input.id },
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });
  return toRecord(row);
}

export async function updateProjectPaths(
  id: string,
  paths: { specPath: string; planPath: string },
): Promise<ProjectRecord> {
  const row = await prisma.project.update({
    where: { id },
    data: { specPath: paths.specPath, planPath: paths.planPath },
  });
  return toRecord(row);
}

/** Count projects with no owner — drives the claim-orphans banner. */
export async function countUnclaimedProjects(): Promise<number> {
  return prisma.project.count({ where: { userId: null } });
}

/** Assign all unclaimed projects to the given user. Returns count claimed. */
export async function claimUnclaimedProjects(userId: string): Promise<number> {
  const result = await prisma.project.updateMany({
    where: { userId: null },
    data: { userId },
  });
  return result.count;
}
