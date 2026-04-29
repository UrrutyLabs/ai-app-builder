import type { Project as PrismaProject } from "@prisma/client";
import { Mode } from "@prisma/client";
import { prisma } from "../client";

export type DomainMode = "greenfield" | "existing_system";

export type ProjectRecord = {
  id: string;
  name: string;
  mode: DomainMode;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toDomainMode = (m: Mode): DomainMode =>
  m === Mode.GREENFIELD ? "greenfield" : "existing_system";

const toPrismaMode = (m: DomainMode): Mode =>
  m === "greenfield" ? Mode.GREENFIELD : Mode.EXISTING_SYSTEM;

const toRecord = (p: PrismaProject): ProjectRecord => ({
  id: p.id,
  name: p.name,
  mode: toDomainMode(p.mode),
  description: p.description,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export async function createProject(input: {
  name: string;
  mode: DomainMode;
  description?: string | null;
}): Promise<ProjectRecord> {
  const row = await prisma.project.create({
    data: {
      name: input.name,
      mode: toPrismaMode(input.mode),
      description: input.description ?? null,
    },
  });
  return toRecord(row);
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const row = await prisma.project.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function updateProject(input: {
  id: string;
  name: string;
  description?: string | null;
}): Promise<ProjectRecord> {
  const row = await prisma.project.update({
    where: { id: input.id },
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });
  return toRecord(row);
}
