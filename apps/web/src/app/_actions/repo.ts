"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ConnectRepoInputSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { ConflictError, NotFoundError } from "@repo/domain";
import {
  fetchAndInferConventions,
  fetchRepoTree,
  parseGitHubUrl,
} from "@repo/repos";
import { decryptToken, encryptToken } from "@repo/repos/secure";
import {
  deleteRepo,
  getEncryptedTokenForProject,
  getProjectById,
  getRepoByProjectId,
  upsertRepo,
  type RepoRecord,
} from "@repo/db";
import { toActionError } from "@/lib/action-error";

export async function connectRepoAction(
  raw: unknown,
): Promise<ActionResult<RepoRecord>> {
  try {
    const input = ConnectRepoInputSchema.parse(raw);

    const project = await getProjectById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }
    if (project.mode !== "existing_system") {
      throw new ConflictError(
        "Repo connection is only available for existing-system projects",
      );
    }

    const ref = parseGitHubUrl(input.repoUrl);
    const fetched = await fetchRepoTree({ ref, token: input.pat });
    const conventions = await fetchAndInferConventions({
      ref: { owner: fetched.owner, repo: fetched.repo },
      token: input.pat,
      fileTree: fetched.tree,
    });
    const encryptedToken = encryptToken(input.pat);

    const record = await upsertRepo({
      projectId: input.projectId,
      owner: fetched.owner,
      repo: fetched.repo,
      defaultBranch: fetched.defaultBranch,
      encryptedToken,
      fileTree: fetched.tree,
      conventions,
    });

    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: record };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

const ProjectIdInput = z.object({ projectId: z.string().min(1) });

export async function refreshRepoAction(
  raw: unknown,
): Promise<ActionResult<RepoRecord>> {
  try {
    const { projectId } = ProjectIdInput.parse(raw);

    const repo = await getRepoByProjectId(projectId);
    if (!repo) {
      throw new NotFoundError(`No repo connected to project ${projectId}`);
    }

    const encrypted = await getEncryptedTokenForProject(projectId);
    if (!encrypted) {
      throw new NotFoundError(`Stored token missing for project ${projectId}`);
    }
    const token = decryptToken(encrypted);

    const fetched = await fetchRepoTree({
      ref: { owner: repo.owner, repo: repo.repo },
      token,
    });
    const conventions = await fetchAndInferConventions({
      ref: { owner: fetched.owner, repo: fetched.repo },
      token,
      fileTree: fetched.tree,
    });

    const record = await upsertRepo({
      projectId,
      owner: fetched.owner,
      repo: fetched.repo,
      defaultBranch: fetched.defaultBranch,
      encryptedToken: encrypted,
      fileTree: fetched.tree,
      conventions,
    });

    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: record };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

export async function disconnectRepoAction(
  raw: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  try {
    const { projectId } = ProjectIdInput.parse(raw);
    await deleteRepo(projectId);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: { projectId } };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
