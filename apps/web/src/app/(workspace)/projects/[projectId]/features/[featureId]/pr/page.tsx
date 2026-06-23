import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import {
  getEncryptedTokenForProject,
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
} from "@repo/db";
import { ImplementationPlanSchema } from "@repo/domain/schemas";
import { decryptToken } from "@repo/repos/server";
import { getCurrentUser } from "@/lib/auth/server";
import { countGeneratable, countScaffoldable } from "@/lib/scaffold-stubs";
import { fetchPrStatus, type PrStatus } from "@/lib/pr-status";
import { CreatePrForm } from "@/components/feature/create-pr-form";
import { PrStatusBadge } from "@/components/feature/pr-status-badge";

export const dynamic = "force-dynamic";

export default async function PrWorkspacePage({
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

  const hubHref = `/projects/${project.id}/features/${feature.id}`;

  const plan = feature.plan
    ? ImplementationPlanSchema.parse(feature.plan)
    : null;
  const hasPlan = !!plan;

  const header = (
    <div className="space-y-3">
      <Link
        href={hubHref}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {feature.title}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Pull request</h1>
    </div>
  );

  // PR creation needs a connected GitHub repo (existing-system projects only).
  if (project.mode !== "existing_system") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Pull requests are only available for existing-system projects with a
          connected GitHub repo.
        </div>
      </div>
    );
  }

  if (!hasPlan) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Generate a plan before opening a pull request.
          <Link
            href={`${hubHref}/plan`}
            className="underline hover:text-foreground"
          >
            Go to plan
          </Link>
        </div>
      </div>
    );
  }

  const repo = await getRepoByProjectId(project.id);
  const existingPaths = new Set(
    repo?.fileTree?.entries
      .filter((e) => e.type === "file")
      .map((e) => e.path) ?? [],
  );
  const scaffoldableCount = countScaffoldable(plan, existingPaths);
  const generatable = countGeneratable(plan, existingPaths);

  let prStatus: PrStatus | null = null;
  if (feature.prUrl && repo) {
    const encrypted = await getEncryptedTokenForProject(project.id);
    if (encrypted) {
      try {
        prStatus = await fetchPrStatus(feature.prUrl, decryptToken(encrypted));
      } catch (err) {
        console.error("[PrWorkspace] PR status fetch failed:", err);
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {header}

      {feature.prUrl ? (
        <div className="space-y-1 rounded-lg border bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <PrStatusBadge status={prStatus} />
            <a
              href={feature.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-foreground"
            >
              {feature.prUrl}
            </a>
          </div>
          {feature.prCreatedAt ? (
            <div className="text-xs text-muted-foreground">
              Opened{" "}
              {feature.prCreatedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <CreatePrForm
        featureId={feature.id}
        defaultSpecPath={project.specPath}
        defaultPlanPath={project.planPath}
        hasExistingPr={!!feature.prUrl}
        scaffoldableCount={scaffoldableCount}
        generatableCreate={generatable.creatable}
        generatableModify={generatable.modifiable}
      />

      <div className="border-t pt-4 text-xs text-muted-foreground">
        Based on the plan · {plan.fileChanges.length} file change
        {plan.fileChanges.length === 1 ? "" : "s"} ·{" "}
        <Link
          href={`${hubHref}/plan`}
          className="underline hover:text-foreground"
        >
          View plan
        </Link>
        {repo ? ` · ${repo.owner}/${repo.repo}` : ""}
      </div>
    </div>
  );
}
