"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { generateQuestions } from "@repo/ai";
import {
  getFeatureById,
  getRepoByProjectId,
  setFeatureQuestions,
  type FeatureRecord,
} from "@repo/db";
import { summarizeConventions, summarizeTree } from "@repo/repos";
import { requireMyProject } from "@/lib/auth/scope";
import { toActionError } from "@/lib/action-error";
import {
  parseTranscriptContext,
  renderTranscriptContext,
} from "@/lib/transcript-context";
import { retrieveProjectContext } from "@/lib/context-retrieval";

const InputSchema = z.object({
  featureId: z.string().min(1),
});

export async function generateQuestionsAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const { featureId } = InputSchema.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await requireMyProject(feature.projectId);

    const repo = await getRepoByProjectId(feature.projectId);
    const repoContext = repo?.fileTree ? summarizeTree(repo.fileTree) : null;
    const conventionsContext = repo?.conventions
      ? summarizeConventions(repo.conventions) || null
      : null;

    const { codeContext, docsContext } = await retrieveProjectContext({
      projectId: feature.projectId,
      query: feature.idea,
    });

    const transcriptContext = renderTranscriptContext(
      parseTranscriptContext(feature.transcriptContext),
    );

    const questions = await generateQuestions({
      idea: feature.idea,
      mode: project.mode,
      repoContext,
      conventionsContext,
      codeContext,
      transcriptContext,
      docsContext,
    });

    const updated = await setFeatureQuestions(featureId, questions);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
