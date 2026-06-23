"use server";

import { revalidatePath } from "next/cache";
import {
  DeleteContextDocInputSchema,
  UploadContextDocInputSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import {
  createContextDoc,
  deleteContextDoc,
  getContextDocById,
  getProjectByIdForUser,
  replaceContextDocEmbeddings,
  type ProjectContextDocRecord,
} from "@repo/db";
import { embedDocContent, MAX_CHUNKS_PER_DOC } from "@repo/repos/server";
import { requireUser } from "@/lib/auth/server";
import { toActionError } from "@/lib/action-error";

export async function uploadContextDocAction(
  raw: unknown,
): Promise<ActionResult<ProjectContextDocRecord>> {
  try {
    const user = await requireUser();
    const input = UploadContextDocInputSchema.parse(raw);

    const project = await getProjectByIdForUser(input.projectId, user.id);
    if (!project) throw new NotFoundError(`Project ${input.projectId} not found`);

    const doc = await createContextDoc({
      projectId: input.projectId,
      title: input.title,
      content: input.content,
      mimeType: input.mimeType,
    });

    // Embedding failure does not fail the upload — the doc is stored and usable;
    // it just won't be retrievable until re-embedded. Mirrors connectRepoAction.
    try {
      const { chunks, truncated } = await embedDocContent(input.content);
      if (truncated) {
        console.warn(
          `[uploadContextDoc] doc ${doc.id} exceeded ${MAX_CHUNKS_PER_DOC} chunks; truncated.`,
        );
      }
      await replaceContextDocEmbeddings(doc.id, chunks);
    } catch (err) {
      console.error("[uploadContextDoc] embedding failed:", err);
    }

    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: doc };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}

export async function deleteContextDocAction(
  raw: unknown,
): Promise<ActionResult<{ docId: string }>> {
  try {
    const user = await requireUser();
    const { docId } = DeleteContextDocInputSchema.parse(raw);

    const doc = await getContextDocById(docId);
    if (!doc) throw new NotFoundError(`Context doc ${docId} not found`);

    // Ownership check: the doc's project must belong to the user.
    const project = await getProjectByIdForUser(doc.projectId, user.id);
    if (!project) throw new NotFoundError(`Context doc ${docId} not found`);

    await deleteContextDoc(docId);
    revalidatePath(`/projects/${doc.projectId}`);
    return { ok: true, data: { docId } };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
