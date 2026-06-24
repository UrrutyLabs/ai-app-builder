"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ExtractFromTranscriptInputSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { extractFromTranscript } from "@repo/ai";
import {
  createFeatureFromTranscript,
  getRepoByProjectId,
  type FeatureRecord,
} from "@repo/db";
import {
  summarizeConventions,
  summarizeTree,
} from "@repo/repos";
import { requireMyProject } from "@/lib/auth/scope";
import { toActionError } from "@/lib/action-error";
import { retrieveProjectContext } from "@/lib/context-retrieval";

export async function extractFromTranscriptAction(
  raw: unknown,
): Promise<ActionResult<FeatureRecord>> {
  let feature: FeatureRecord;
  try {
    const input = ExtractFromTranscriptInputSchema.parse(raw);

    const project = await requireMyProject(input.projectId);

    const repo = await getRepoByProjectId(input.projectId);
    const repoContext = repo?.fileTree ? summarizeTree(repo.fileTree) : null;
    const conventionsContext = repo?.conventions
      ? summarizeConventions(repo.conventions) || null
      : null;

    const { codeContext, docsContext } = await retrieveProjectContext({
      projectId: input.projectId,
      query: input.transcript.slice(0, 4000),
    });

    const extraction = await extractFromTranscript({
      transcript: input.transcript,
      mode: project.mode,
      repoContext,
      conventionsContext,
      codeContext,
      docsContext,
    });

    feature = await createFeatureFromTranscript({
      projectId: input.projectId,
      title: extraction.title,
      idea: extraction.idea,
      transcript: input.transcript,
      transcriptContext: {
        decisions: extraction.decisions,
        constraints: extraction.constraints,
        openQuestions: extraction.openQuestions,
      },
    });
    revalidatePath(`/projects/${input.projectId}`);
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
  redirect(`/projects/${feature.projectId}/features/${feature.id}`);
}
