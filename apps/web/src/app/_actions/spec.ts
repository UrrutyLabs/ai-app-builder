"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  QuestionListSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@repo/domain";
import { generateSpec } from "@repo/ai";
import {
  approveFeatureSpec,
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
  setFeatureSpec,
  type FeatureRecord,
} from "@repo/db";
import {
  summarizeConventions,
  summarizeTree,
} from "@repo/repos";
import { requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";
import {
  parseTranscriptContext,
  renderTranscriptContext,
} from "@/lib/transcript-context";
import { retrieveProjectContext } from "@/lib/context-retrieval";

const FeatureIdInput = z.object({
  featureId: z.string().min(1),
});

export async function generateSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const user = await requireUser();
    const { featureId } = FeatureIdInput.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await getProjectByIdForUser(feature.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${feature.projectId} not found`);

    if (!feature.questions || !feature.answers) {
      throw new ValidationError(
        "Feature must have questions and answers before generating a spec",
      );
    }

    const questions = QuestionListSchema.parse(feature.questions);
    const answers = AnswerListSchema.parse(feature.answers);

    const repo = await getRepoByProjectId(feature.projectId);
    const repoContext = repo?.fileTree ? summarizeTree(repo.fileTree) : null;
    const conventionsContext = repo?.conventions
      ? summarizeConventions(repo.conventions) || null
      : null;

    const { codeContext, docsContext } = await retrieveProjectContext({
      projectId: feature.projectId,
      query: `${feature.idea}\n\n${answers.map((a) => a.text).join("\n")}`,
    });

    const transcriptContext = renderTranscriptContext(
      parseTranscriptContext(feature.transcriptContext),
    );

    const spec = await generateSpec({
      title: feature.title,
      idea: feature.idea,
      mode: project.mode,
      questions,
      answers,
      repoContext,
      conventionsContext,
      codeContext,
      transcriptContext,
      docsContext,
    });

    const updated = await setFeatureSpec(featureId, spec);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

const SaveSpecInput = z.object({
  featureId: z.string().min(1),
  spec: FeatureSpecSchema,
});

export async function saveSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  let feature: FeatureRecord;
  try {
    const user = await requireUser();
    const input = SaveSpecInput.parse(raw);
    const existing = await getFeatureById(input.featureId);
    if (!existing) throw new NotFoundError(`Feature ${input.featureId} not found`);
    const project = await getProjectByIdForUser(existing.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${existing.projectId} not found`);
    feature = await setFeatureSpec(input.featureId, input.spec);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${feature.projectId}/features/${feature.id}`);
}

export async function approveSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const user = await requireUser();
    const { featureId } = FeatureIdInput.parse(raw);
    const existing = await getFeatureById(featureId);
    if (!existing) throw new NotFoundError(`Feature ${featureId} not found`);
    const project = await getProjectByIdForUser(existing.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${existing.projectId} not found`);
    if (!existing.spec) {
      throw new ConflictError("Cannot approve a feature with no spec");
    }
    const updated = await approveFeatureSpec(featureId);
    revalidatePath(`/projects/${existing.projectId}/features/${existing.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
