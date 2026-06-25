"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { DecisionKindSchema } from "@repo/domain/schemas";
import {
  createDecision,
  getDecisionById,
  getFeatureById,
  setDecisionStatus,
  type DecisionRecord,
} from "@repo/db";
import { requireMyProject } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";

const AddInput = z.object({
  featureId: z.string().min(1),
  kind: DecisionKindSchema,
  statement: z.string().min(1).max(400),
});

export async function addDecisionAction(
  raw: unknown,
): Promise<ActionResult<DecisionRecord>> {
  try {
    const user = await requireUser();
    const input = AddInput.parse(raw);

    const feature = await getFeatureById(input.featureId);
    if (!feature) throw new NotFoundError(`Feature ${input.featureId} not found`);
    await requireMyProject(feature.projectId);

    const decision = await createDecision(input.featureId, {
      kind: input.kind,
      // A human adding a decision is accepting it; questions stay open.
      status: input.kind === "OPEN_QUESTION" ? "OPEN" : "ACCEPTED",
      statement: input.statement,
      sourceType: "HUMAN_EDIT",
      createdBy: user.id,
    });

    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: decision };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

// The panel only flips between these three; SUPERSEDED is reserved for the
// (not-yet-built) edit path.
const StatusInput = z.object({
  decisionId: z.string().min(1),
  status: z.enum(["OPEN", "ACCEPTED", "REJECTED"]),
});

export async function setDecisionStatusAction(
  raw: unknown,
): Promise<ActionResult<DecisionRecord>> {
  try {
    const input = StatusInput.parse(raw);

    const existing = await getDecisionById(input.decisionId);
    if (!existing) {
      throw new NotFoundError(`Decision ${input.decisionId} not found`);
    }
    const feature = await getFeatureById(existing.featureId);
    if (!feature) {
      throw new NotFoundError(`Feature ${existing.featureId} not found`);
    }
    await requireMyProject(feature.projectId);

    const decision = await setDecisionStatus(input.decisionId, input.status);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: decision };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
