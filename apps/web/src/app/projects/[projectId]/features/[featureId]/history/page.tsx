import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFeatureById,
  getProjectById,
  listSpecVersionsByFeatureId,
} from "@repo/db";
import { diffSpecs } from "@/lib/spec-diff";
import { SpecDiffView } from "@/components/feature/spec-diff-view";

export default async function FeatureHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = await params;
  const [project, feature] = await Promise.all([
    getProjectById(projectId),
    getFeatureById(featureId),
  ]);
  if (!project || !feature || feature.projectId !== project.id) notFound();

  const versions = await listSpecVersionsByFeatureId(featureId);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}/features/${feature.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← {feature.title}
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Spec history
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {versions.length} version{versions.length === 1 ? "" : "s"} —
          newest first. Each diff is against the version before it.
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
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
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {v.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {isFirst ? (
                    <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
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
