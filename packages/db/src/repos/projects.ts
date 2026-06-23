import type { Project as PrismaProject } from "@prisma/client";
import { Mode } from "@prisma/client";
import { prisma } from "../client";

export type DomainMode = "greenfield" | "existing_system";

export type ProjectRecord = {
  id: string;
  userId: string | null;
  name: string;
  mode: DomainMode;
  description: string | null;
  specPath: string | null;
  planPath: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toDomainMode = (m: Mode): DomainMode =>
  m === Mode.GREENFIELD ? "greenfield" : "existing_system";

const toPrismaMode = (m: DomainMode): Mode =>
  m === "greenfield" ? Mode.GREENFIELD : Mode.EXISTING_SYSTEM;

const toRecord = (p: PrismaProject): ProjectRecord => ({
  id: p.id,
  userId: p.userId,
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
  name: string;
  mode: DomainMode;
  description?: string | null;
}): Promise<ProjectRecord> {
  const row = await prisma.project.create({
    data: {
      userId: input.userId,
      name: input.name,
      mode: toPrismaMode(input.mode),
      description: input.description ?? null,
    },
  });
  return toRecord(row);
}

/** All projects owned by the user (excludes unclaimed projects with userId=null). */
export async function listProjectsByUserId(
  userId: string,
): Promise<ProjectRecord[]> {
  const rows = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

/**
 * Fetch a project by id, scoped to the user. Returns null for both missing and
 * unowned projects — never leak existence by distinguishing 404 vs 403.
 */
export async function getProjectByIdForUser(
  id: string,
  userId: string,
): Promise<ProjectRecord | null> {
  const row = await prisma.project.findFirst({ where: { id, userId } });
  return row ? toRecord(row) : null;
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
  name: string;
  description?: string | null;
}): Promise<ProjectRecord> {
  // Filter on { id, userId } to refuse cross-user updates. updateMany returns
  // a count rather than the row — use update with composite where via findFirst
  // semantics: do a scoped fetch then update.
  const existing = await prisma.project.findFirst({
    where: { id: input.id, userId: input.userId },
    select: { id: true },
  });
  if (!existing) throw new Error("Project not found or not owned by user");
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
