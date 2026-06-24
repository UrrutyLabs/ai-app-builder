"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateFeatureInputSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { createFeature, type FeatureRecord } from "@repo/db";
import { requireMyProject } from "@/lib/auth/scope";
import { toActionError } from "@/lib/action-error";

export async function createFeatureAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  let feature: FeatureRecord;
  try {
    const input = CreateFeatureInputSchema.parse(raw);
    await requireMyProject(input.projectId);
    feature = await createFeature(input);
    revalidatePath(`/projects/${input.projectId}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${feature.projectId}/features/${feature.id}`);
}
