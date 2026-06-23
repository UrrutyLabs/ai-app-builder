import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFeatureById,
  getProjectByIdForUser,
  listSpecVersionsByFeatureId,
} from "@repo/db";
import { getCurrentUser } from "@/lib/auth/server";
import { diffSpecs } from "@/lib/spec-diff";
import { SpecDiffView } from "@/components/feature/spec-diff-view";

export const dynamic = "force-dynamic";

export default async function FeatureHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();
  const [project, feature] = await Promise.all([
    getProjectByIdForUser(projectId, user.id),
    getFeatureById(featureId),
  ]);
  if (!project || !feature || feature.projectId !== project.id) notFound();

  const versions = await listSpecVersionsByFeatureId(featureId);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}/features/${feature.id}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {feature.title}
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Spec history
        </h1>
        <p className="text-sm text-muted-foreground">
          {versions.length} version{versions.length === 1 ? "" : "s"} —
          newest first. Each diff is against the version before it.
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No spec versions yet. Generate a spec to start the history.
        </div>
      ) : (
        <ol className="space-y-8">
          {versions.map((v, idx) => {
            // diff against the next entry in the array (which is the older
            // version because list is newest-first).
            const previous = versions[idx + 1];
            const isFirst = !previous;
            const lines = diffSpecs(
              previous?.spec ?? null,
              v.spec,
              previous ? "previous" : "(empty)",
              "this version",
            );
            return (
              <li key={v.id} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-sm font-medium">
                    {idx === 0 ? "Current" : `Version ${versions.length - idx}`}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {v.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {isFirst ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      initial
                    </span>
                  ) : null}
                </div>
                <SpecDiffView lines={lines} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
