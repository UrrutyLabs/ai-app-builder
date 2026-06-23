import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderGit2, History, Lock, Mic } from "lucide-react";
import {
  countSpecVersionsByFeatureId,
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
  listContextDocsByProjectId,
} from "@repo/db";
import { AnswerListSchema, FeatureSpecSchema } from "@repo/domain/schemas";
import { getCurrentUser } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SpecView } from "@/components/feature/spec-view";
import { SpecEditor } from "@/components/feature/spec-editor";
import { GenerateSpecButton } from "@/components/feature/generate-spec-button";
import { ApproveSpecButton } from "@/components/feature/approve-spec-button";

export const dynamic = "force-dynamic";

export default async function SpecWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { projectId, featureId } = await params;
  const { edit } = await searchParams;
  const user = await getCurrentUser();
  if (!user) notFound();
  const [project, feature] = await Promise.all([
    getProjectByIdForUser(projectId, user.id),
    getFeatureById(featureId),
  ]);
  if (!project || !feature || feature.projectId !== project.id) notFound();

  const hubHref = `/projects/${project.id}/features/${feature.id}`;
  const specHref = `${hubHref}/spec`;

  const answers = feature.answers
    ? AnswerListSchema.parse(feature.answers)
    : null;
  const spec = feature.spec ? FeatureSpecSchema.parse(feature.spec) : null;
  const hasAnswers = !!answers && answers.length > 0;
  const hasSpec = !!spec;
  const isApproved = !!feature.approvedAt;
  const editing = edit === "1" && hasSpec;

  const [repo, docs, versionCount] = await Promise.all([
    project.mode === "existing_system"
      ? getRepoByProjectId(project.id)
      : Promise.resolve(null),
    listContextDocsByProjectId(project.id),
    countSpecVersionsByFeatureId(feature.id),
  ]);
  const fileCount =
    repo?.fileTree?.entries.filter((e) => e.type === "file").length ?? 0;

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
          <h1 className="text-2xl font-semibold tracking-tight">Spec</h1>
          {hasSpec ? (
            <Badge variant="secondary">
              v{Math.max(versionCount, 1)}
            </Badge>
          ) : null}
          {isApproved ? (
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              ✓ Approved
            </span>
          ) : null}
        </div>
      </div>

      {!hasAnswers ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Answer the clarifying questions first.
          <Link href={hubHref} className="underline hover:text-foreground">
            Go to questions
          </Link>
        </div>
      ) : editing && spec ? (
        <SpecEditor
          featureId={feature.id}
          projectId={project.id}
          spec={spec}
          returnHref={specHref}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            {hasSpec ? (
              <SpecView spec={spec} />
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No spec yet. Generate one from the idea, Q&amp;A, and project
                context.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <GenerateSpecButton featureId={feature.id} hasSpec={hasSpec} />
              {hasSpec ? (
                <Link
                  href={`${specHref}?edit=1`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Edit
                </Link>
              ) : null}
              {hasSpec && !isApproved ? (
                <ApproveSpecButton featureId={feature.id} />
              ) : null}
            </div>
            {hasSpec ? (
              <p className="text-xs text-muted-foreground">
                Regenerating or editing the spec clears approval and any
                implementation plan.
              </p>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-14 lg:self-start">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Versions
              </div>
              <div className="mt-2 text-sm">
                {versionCount > 0 ? (
                  <Link
                    href={`${hubHref}/history`}
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    <History
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {versionCount} version{versionCount === 1 ? "" : "s"} —
                    view history
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    No versions yet
                  </span>
                )}
              </div>
            </div>

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
                      <span className="text-muted-foreground">No repo</span>
                    )}
                  </li>
                ) : null}
                <li className="flex items-start gap-2">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Link
                    href={`/projects/${project.id}`}
                    className="hover:text-foreground"
                  >
                    {docs.length > 0
                      ? `${docs.length} context doc${docs.length === 1 ? "" : "s"}`
                      : "No context docs"}
                  </Link>
                </li>
                {feature.transcript ? (
                  <li className="flex items-start gap-2">
                    <Mic
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Link href={hubHref} className="hover:text-foreground">
                      Refinement transcript
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
