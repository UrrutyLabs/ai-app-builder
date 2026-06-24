"use server";

import { revalidatePath } from "next/cache";
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
  getRepoByProjectId,
  getSpecVersionById,
  listSpecVersionsByFeatureId,
  setFeatureSpec,
  type FeatureRecord,
} from "@repo/db";
import {
  summarizeConventions,
  summarizeTree,
} from "@repo/repos";
import { requireMyProject } from "@/lib/auth/scope";
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
    const { featureId } = FeatureIdInput.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await requireMyProject(feature.projectId);

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

    const updated = await setFeatureSpec(featureId, spec, "Generated");
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

const SaveSpecInput = z.object({
  featureId: z.string().min(1),
  spec: FeatureSpecSchema,
  // Optional history label, e.g. "Edited Acceptance criteria".
  note: z.string().min(1).max(120).optional(),
});

export async function saveSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const input = SaveSpecInput.parse(raw);
    const existing = await getFeatureById(input.featureId);
    if (!existing) throw new NotFoundError(`Feature ${input.featureId} not found`);
    await requireMyProject(existing.projectId);
    const feature = await setFeatureSpec(input.featureId, input.spec, input.note);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: feature };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

const RestoreSpecVersionInput = z.object({
  featureId: z.string().min(1),
  versionId: z.string().min(1),
});

export async function restoreSpecVersionAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const { featureId, versionId } = RestoreSpecVersionInput.parse(raw);
    const existing = await getFeatureById(featureId);
    if (!existing) throw new NotFoundError(`Feature ${featureId} not found`);
    await requireMyProject(existing.projectId);

    const version = await getSpecVersionById(versionId);
    if (!version || version.featureId !== featureId) {
      throw new NotFoundError(`Spec version ${versionId} not found`);
    }

    // Label the new version with the restored version's number (1-based,
    // oldest first), so history reads "Restored v2".
    const versions = await listSpecVersionsByFeatureId(featureId);
    const idx = versions.findIndex((v) => v.id === versionId);
    const number = idx >= 0 ? versions.length - idx : 0;

    const feature = await setFeatureSpec(
      featureId,
      version.spec,
      number > 0 ? `Restored v${number}` : "Restored an earlier version",
    );
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: feature };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

export async function approveSpecAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const { featureId } = FeatureIdInput.parse(raw);
    const existing = await getFeatureById(featureId);
    if (!existing) throw new NotFoundError(`Feature ${featureId} not found`);
    await requireMyProject(existing.projectId);
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
