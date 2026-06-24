import type { PrEvent } from "@/lib/pr-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Long-running route — generation can take 30–90s. Bump if your deploy target
// has a default timeout. Vercel free tier caps at 10s; pro/team is higher.
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dynamic imports keep env-bound modules out of build-time analysis. Next.js
  // collects page data for every route at build time; if the route module
  // imports env at the top level, validation throws when env vars aren't
  // present in the build worker.
  const [
    { runPrCreation },
    { toActionError },
    { getActiveOrganizationId, requireUser },
  ] = await Promise.all([
    import("@/lib/pr-runner"),
    import("@/lib/action-error"),
    import("@/lib/auth/server"),
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
  const organizationId = await getActiveOrganizationId();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PrEvent): void => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        const summary = await runPrCreation(raw, send, userId, organizationId);
        send({
          type: "pr-opened",
          url: summary.prUrl,
          number: summary.prNumber,
          scaffoldedCount: summary.scaffoldedCount,
          generatedCount: summary.generatedCount,
          modifiedCount: summary.modifiedCount,
          unverifiedFiles: summary.unverifiedFiles,
          consistencyIssues: summary.consistencyIssues,
        });
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
