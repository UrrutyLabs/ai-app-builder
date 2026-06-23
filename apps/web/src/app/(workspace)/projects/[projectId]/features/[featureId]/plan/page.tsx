import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderGit2, Lock } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PlanView } from "@/components/feature/plan-view";
import { GeneratePlanButton } from "@/components/feature/generate-plan-button";
import { CreatePrForm } from "@/components/feature/create-pr-form";
import { PrStatusBadge } from "@/components/feature/pr-status-badge";

export const dynamic = "force-dynamic";

export default async function PlanWorkspacePage({
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
  const isApproved = !!feature.approvedAt;

  const repo =
    project.mode === "existing_system"
      ? await getRepoByProjectId(project.id)
      : null;
  const existingPaths = new Set(
    repo?.fileTree?.entries
      .filter((e) => e.type === "file")
      .map((e) => e.path) ?? [],
  );
  const scaffoldableCount = plan ? countScaffoldable(plan, existingPaths) : 0;
  const generatable = plan
    ? countGeneratable(plan, existingPaths)
    : { creatable: 0, modifiable: 0, total: 0 };
  const fileCount =
    repo?.fileTree?.entries.filter((e) => e.type === "file").length ?? 0;

  let prStatus: PrStatus | null = null;
  if (feature.prUrl && repo) {
    const encrypted = await getEncryptedTokenForProject(project.id);
    if (encrypted) {
      try {
        prStatus = await fetchPrStatus(feature.prUrl, decryptToken(encrypted));
      } catch (err) {
        console.error("[PlanWorkspace] PR status fetch failed:", err);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="space-y-3">
        <Link
          href={hubHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {feature.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Plan &amp; PR
          </h1>
          {hasPlan ? (
            <Badge variant="secondary">
              {plan.fileChanges.length} file
              {plan.fileChanges.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </div>

      {!isApproved ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Approve the spec to generate a plan.
          <Link
            href={`${hubHref}/spec`}
            className="underline hover:text-foreground"
          >
            Go to spec
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-8">
            <section className="space-y-3">
              {hasPlan ? (
                <PlanView plan={plan} />
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No plan yet. Generate it from the approved spec.
                </div>
              )}
              <GeneratePlanButton featureId={feature.id} hasPlan={hasPlan} />
              {hasPlan ? (
                <p className="text-xs text-muted-foreground">
                  Regenerating the plan overwrites the current one.
                </p>
              ) : null}
            </section>

            {hasPlan && project.mode === "existing_system" ? (
              <section className="space-y-3 border-t pt-6">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Pull request
                </h2>
                {feature.prUrl ? (
                  <div className="space-y-1 text-sm">
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
              </section>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-14 lg:self-start">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Grounded in
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {project.mode === "existing_system" ? (
                  <li className="flex items-start gap-2">
                    <FolderGit2
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {repo ? (
                      <span>
                        {repo.owner}/{repo.repo}
                        <span className="block text-xs text-muted-foreground">
                          {fileCount} files indexed
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-muted-foreground underline hover:text-foreground"
                      >
                        Connect a repo
                      </Link>
                    )}
                  </li>
                ) : null}
              </ul>
              <Link
                href={`${hubHref}/spec`}
                className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-3`}
              >
                View spec
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
