"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateFeatureInputSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { createFeature, getProjectByIdForUser, type FeatureRecord } from "@repo/db";
import { requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";

export async function createFeatureAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  let feature: FeatureRecord;
  try {
    const user = await requireUser();
    const input = CreateFeatureInputSchema.parse(raw);
    const project = await getProjectByIdForUser(input.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${input.projectId} not found`);
    feature = await createFeature(input);
    revalidatePath(`/projects/${input.projectId}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${feature.projectId}/features/${feature.id}`);
}
