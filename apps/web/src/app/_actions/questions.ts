"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { generateQuestions } from "@repo/ai";
import {
  getFeatureById,
  getProjectById,
  getRepoByProjectId,
  searchSimilarFiles,
  setFeatureQuestions,
  type FeatureRecord,
} from "@repo/db";
import { renderSnippets, summarizeConventions, summarizeTree } from "@repo/repos";
import { embedQuery } from "@repo/repos/server";
import { toActionError } from "@/lib/action-error";

const InputSchema = z.object({
  featureId: z.string().min(1),
});

const TOP_K = 8;

export async function generateQuestionsAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  try {
    const { featureId } = InputSchema.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await getProjectById(feature.projectId);
    if (!project) throw new NotFoundError(`Project ${feature.projectId} not found`);

    const repo = await getRepoByProjectId(feature.projectId);
    const repoContext = repo?.fileTree ? summarizeTree(repo.fileTree) : null;
    const conventionsContext = repo?.conventions
      ? summarizeConventions(repo.conventions) || null
      : null;

    let codeContext: string | null = null;
    if (repo) {
      try {
        const queryEmbedding = await embedQuery(feature.idea);
        const snippets = await searchSimilarFiles(repo.id, queryEmbedding, TOP_K);
        if (snippets.length > 0) codeContext = renderSnippets(snippets);
      } catch (err) {
        console.error("[generateQuestions] retrieval failed:", err);
      }
    }

    const questions = await generateQuestions({
      idea: feature.idea,
      mode: project.mode,
      repoContext,
      conventionsContext,
      codeContext,
    });

    const updated = await setFeatureQuestions(featureId, questions);
    revalidatePath(`/projects/${feature.projectId}/features/${feature.id}`);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
