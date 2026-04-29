"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateProjectInputSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { createProject, type ProjectRecord } from "@repo/db";
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
