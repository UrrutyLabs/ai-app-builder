"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FeatureSpecSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import {
  ConflictError,
  NotFoundError,
} from "@repo/domain";
import { generatePlan } from "@repo/ai";
import {
  getFeatureById,
  getProjectByIdForUser,
  setFeaturePlan,
  type FeatureRecord,
} from "@repo/db";
import { requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";

const InputSchema = z.object({
  featureId: z.string().min(1),
});

export async function generatePlanAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const user = await requireUser();
    const { featureId } = InputSchema.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await getProjectByIdForUser(feature.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${feature.projectId} not found`);

    if (feature.status !== "SPEC_APPROVED" && feature.status !== "PLAN_GENERATED") {
      throw new ConflictError(
        "Feature spec must be approved before generating a plan",
      );
    }
    if (!feature.spec) {
      throw new ConflictError("Cannot generate a plan with no spec");
    }

    const spec = FeatureSpecSchema.parse(feature.spec);
    const plan = await generatePlan({ spec });

    const updated = await setFeaturePlan(featureId, plan);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
