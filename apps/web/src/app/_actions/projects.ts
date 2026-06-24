"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import {
  claimLegacyProjectsForUser,
  claimUnclaimedProjects,
  createProject,
  getProjectForUser,
  updateProject,
  type ProjectRecord,
} from "@repo/db";
import { getActiveOrganizationId, requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";

export async function createProjectAction(
  raw: unknown,
): Promise<ActionResult<ProjectRecord>> {
  let project: ProjectRecord;
  try {
    const user = await requireUser();
    const organizationId = await getActiveOrganizationId();
    const input = CreateProjectInputSchema.parse(raw);
    project = await createProject({
      userId: user.id,
      organizationId,
      name: input.name,
      mode: input.mode,
      description: input.description ?? null,
    });
    revalidatePath("/");
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  raw: unknown,
): Promise<ActionResult<ProjectRecord>> {
  let project: ProjectRecord;
  try {
    const user = await requireUser();
    const organizationId = await getActiveOrganizationId();
    const input = UpdateProjectInputSchema.parse(raw);
    const existing = await getProjectForUser(input.id, user.id, organizationId);
    if (!existing) throw new NotFoundError(`Project ${input.id} not found`);
    project = await updateProject({
      id: input.id,
      userId: user.id,
      organizationId,
      name: input.name,
      description: input.description ?? null,
    });
    revalidatePath("/");
    revalidatePath(`/projects/${project.id}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${project.id}`);
}

export async function claimUnclaimedProjectsAction(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const user = await requireUser();
    const count = await claimUnclaimedProjects(user.id);
    revalidatePath("/");
    return { ok: true, data: { count } };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

// Backfill: move the caller's legacy (org-less) projects into their active
// organization. Called by the client org bootstrap right after it ensures a
// personal org exists and is active. No-op when there's no active org yet.
export async function claimMyLegacyProjectsAction(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const user = await requireUser();
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) return { ok: true, data: { count: 0 } };
    const count = await claimLegacyProjectsForUser(user.id, organizationId);
    revalidatePath("/");
    return { ok: true, data: { count } };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
