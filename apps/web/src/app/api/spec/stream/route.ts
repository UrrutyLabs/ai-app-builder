import type { SpecEvent } from "@/lib/spec-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface RawBody {
  featureId?: unknown;
}

export async function POST(req: Request): Promise<Response> {
  let body: RawBody;
  try {
    body = (await req.json()) as RawBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const featureId =
    typeof body.featureId === "string" && body.featureId.length > 0
      ? body.featureId
      : null;
  if (!featureId) {
    return new Response(JSON.stringify({ error: "featureId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dynamic imports keep env-bound modules out of build-time analysis.
  const [
    { generateSpecStream },
    { AnswerListSchema, QuestionListSchema },
    {
      getFeatureById,
      getProjectByIdForUser,
      getRepoByProjectId,
      searchSimilarFiles,
      setFeatureSpec,
    },
    { renderSnippets, summarizeConventions, summarizeTree },
    { embedQuery },
    { requireUser },
    { toActionError },
    { revalidatePath },
  ] = await Promise.all([
    import("@repo/ai"),
    import("@repo/domain/schemas"),
    import("@repo/db"),
    import("@repo/repos"),
    import("@repo/repos/server"),
    import("@/lib/auth/server"),
    import("@/lib/action-error"),
    import("next/cache"),
  ]);

  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    const e = toActionError(err);
    return new Response(JSON.stringify({ error: e.message, code: e.code }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SpecEvent): void => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        const feature = await getFeatureById(featureId);
        if (!feature) throw new Error(`Feature ${featureId} not found`);
        const project = await getProjectByIdForUser(feature.projectId, userId);
        if (!project)
          throw new Error(`Project ${feature.projectId} not found`);
        if (!feature.questions || !feature.answers) {
          throw new Error(
            "Feature must have questions and answers before generating a spec",
          );
        }

        const questions = QuestionListSchema.parse(feature.questions);
        const answers = AnswerListSchema.parse(feature.answers);

        const repo = await getRepoByProjectId(feature.projectId);
        const repoContext = repo?.fileTree
          ? summarizeTree(repo.fileTree)
          : null;
        const conventionsContext = repo?.conventions
          ? summarizeConventions(repo.conventions) || null
          : null;

        let codeContext: string | null = null;
        if (repo) {
          try {
            const query = `${feature.idea}\n\n${answers
              .map((a) => a.text)
              .join("\n")}`;
            const queryEmbedding = await embedQuery(query);
            const snippets = await searchSimilarFiles(
              repo.id,
              queryEmbedding,
              8,
            );
            if (snippets.length > 0) codeContext = renderSnippets(snippets);
          } catch (err) {
            console.error("[streamSpec] retrieval failed:", err);
          }
        }

        let finalSpec: import("@repo/domain/schemas").FeatureSpec | null = null;
        for await (const event of generateSpecStream({
          title: feature.title,
          idea: feature.idea,
          mode: project.mode,
          questions,
          answers,
          repoContext,
          conventionsContext,
          codeContext,
        })) {
          if (event.kind === "snapshot") {
            send({ type: "snapshot", snapshot: event.snapshot });
          } else if (event.kind === "complete") {
            finalSpec = event.spec;
          } else {
            throw new Error(event.message);
          }
        }

        if (!finalSpec) throw new Error("Stream ended without a final spec");

        await setFeatureSpec(featureId, finalSpec);
        revalidatePath(`/projects/${project.id}/features/${feature.id}`);
        send({ type: "complete", spec: finalSpec });
      } catch (err) {
        const e = toActionError(err);
        send({ type: "error", code: e.code, message: e.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
