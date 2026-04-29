"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AnswerListSchema } from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import {
  getFeatureById,
  setFeatureAnswers,
  type FeatureRecord,
} from "@repo/db";
import { toActionError } from "@/lib/action-error";

const InputSchema = z.object({
  featureId: z.string().min(1),
  answers: AnswerListSchema,
});

export async function saveAnswersAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  let feature: FeatureRecord;
  try {
    const input = InputSchema.parse(raw);
    const existing = await getFeatureById(input.featureId);
    if (!existing) throw new NotFoundError(`Feature ${input.featureId} not found`);
    feature = await setFeatureAnswers(input.featureId, input.answers);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${feature.projectId}/features/${feature.id}`);
}
