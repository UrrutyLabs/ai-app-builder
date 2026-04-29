import type { Repo as PrismaRepo, Prisma } from "@prisma/client";
import {
  ConventionsSchema,
  FileTreeSchema,
  type Conventions,
  type FileTree,
} from "@repo/domain/schemas";
import { prisma } from "../client";

export type RepoRecord = {
  id: string;
  projectId: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  fileTree: FileTree | null;
  conventions: Conventions | null;
  lastIndexedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toRecord = (r: PrismaRepo): RepoRecord => ({
  id: r.id,
  projectId: r.projectId,
  owner: r.owner,
  repo: r.repo,
  defaultBranch: r.defaultBranch,
  fileTree: r.fileTree ? FileTreeSchema.parse(r.fileTree) : null,
  conventions: r.conventions ? ConventionsSchema.parse(r.conventions) : null,
  lastIndexedAt: r.lastIndexedAt,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export async function getRepoByProjectId(
  projectId: string,
): Promise<RepoRecord | null> {
  const row = await prisma.repo.findUnique({ where: { projectId } });
  return row ? toRecord(row) : null;
}

/** Internal-only: never expose to the client. */
export async function getEncryptedTokenForProject(
  projectId: string,
): Promise<string | null> {
  const row = await prisma.repo.findUnique({
    where: { projectId },
    select: { encryptedToken: true },
  });
  return row?.encryptedToken ?? null;
}

export async function upsertRepo(input: {
  projectId: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  encryptedToken: string;
  fileTree: FileTree;
  conventions: Conventions;
}): Promise<RepoRecord> {
  const validatedTree = FileTreeSchema.parse(input.fileTree);
  const validatedConventions = ConventionsSchema.parse(input.conventions);
  const data = {
    owner: input.owner,
    repo: input.repo,
    defaultBranch: input.defaultBranch,
    encryptedToken: input.encryptedToken,
    fileTree: validatedTree as Prisma.InputJsonValue,
    conventions: validatedConventions as Prisma.InputJsonValue,
    lastIndexedAt: new Date(),
  };
  const row = await prisma.repo.upsert({
    where: { projectId: input.projectId },
    create: { projectId: input.projectId, ...data },
    update: data,
  });
  return toRecord(row);
}

export async function deleteRepo(projectId: string): Promise<void> {
  await prisma.repo.delete({ where: { projectId } });
}
