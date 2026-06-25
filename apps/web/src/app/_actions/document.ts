"use server";

import { revalidatePath } from "next/cache";
import {
  ExtractFromDocumentInputSchema,
  type NewDecision,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { extractFromDocument } from "@repo/ai";
import {
  createFeatureWithDecisions,
  getContextDocById,
  getRepoByProjectId,
} from "@repo/db";
import { summarizeConventions, summarizeTree } from "@repo/repos";
import { requireMyProject } from "@/lib/auth/scope";
import { toActionError } from "@/lib/action-error";
import { retrieveProjectContext } from "@/lib/context-retrieval";

export interface DocumentExtractionResult {
  projectId: string;
  featureId: string;
  // Other features the document describes, surfaced (not created) so the user
  // can spin them up separately. One feature per document for now.
  otherFeaturesDetected: string[];
}

export async function extractFromDocumentAction(
  raw: unknown,
): Promise<ActionResult<DocumentExtractionResult>> {
  try {
    const input = ExtractFromDocumentInputSchema.parse(raw);
    const project = await requireMyProject(input.projectId);

    const doc = await getContextDocById(input.contextDocId);
    if (!doc || doc.projectId !== input.projectId) {
      throw new NotFoundError(`Document ${input.contextDocId} not found`);
    }

    const repo = await getRepoByProjectId(input.projectId);
    const repoContext = repo?.fileTree ? summarizeTree(repo.fileTree) : null;
    const conventionsContext = repo?.conventions
      ? summarizeConventions(repo.conventions) || null
      : null;

    const { codeContext, docsContext } = await retrieveProjectContext({
      projectId: input.projectId,
      query: doc.content.slice(0, 4000),
    });

    const extraction = await extractFromDocument({
      documentTitle: doc.title,
      document: doc.content,
      mode: project.mode,
      repoContext,
      conventionsContext,
      codeContext,
      docsContext,
    });

    // Distilled document items → decisions with CONTEXT_DOC provenance pointing
    // at the source doc. Machine-distilled → createdBy "ai".
    const mk = (
      kind: NewDecision["kind"],
      status: NewDecision["status"],
      statements: string[],
    ): NewDecision[] =>
      statements.map((statement) => ({
        kind,
        status,
        statement,
        sourceType: "CONTEXT_DOC",
        sourceId: input.contextDocId,
        createdBy: "ai",
      }));
    const decisions: NewDecision[] = [
      ...mk("DECISION", "ACCEPTED", extraction.decisions),
      ...mk("CONSTRAINT", "ACCEPTED", extraction.constraints),
      ...mk("OPEN_QUESTION", "OPEN", extraction.openQuestions),
    ];

    const feature = await createFeatureWithDecisions({
      projectId: input.projectId,
      title: extraction.title,
      idea: extraction.idea,
      decisions,
    });

    revalidatePath(`/projects/${input.projectId}`);
    return {
      ok: true,
      data: {
        projectId: input.projectId,
        featureId: feature.id,
        otherFeaturesDetected: extraction.otherFeaturesDetected,
      },
    };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
