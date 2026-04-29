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
  createProject,
  getProjectById,
  updateProject,
  type ProjectRecord,
} from "@repo/db";
import { toActionError } from "@/lib/action-error";

export async function createProjectAction(
  raw: unknown,
): Promise<ActionResult<ProjectRecord>> {
  let project: ProjectRecord;
  try {
    const input = CreateProjectInputSchema.parse(raw);
    project = await createProject({
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
    const input = UpdateProjectInputSchema.parse(raw);
    const existing = await getProjectById(input.id);
    if (!existing) throw new NotFoundError(`Project ${input.id} not found`);
    project = await updateProject({
      id: input.id,
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
