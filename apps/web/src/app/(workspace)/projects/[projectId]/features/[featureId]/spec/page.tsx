import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderGit2, Lock, Mic } from "lucide-react";
import {
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
  getSpecVersionById,
  listContextDocsByProjectId,
  listSpecVersionsByFeatureId,
} from "@repo/db";
import { AnswerListSchema, FeatureSpecSchema } from "@repo/domain/schemas";
import { getCurrentUser } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { SpecView } from "@/components/feature/spec-view";
import { SpecSections } from "@/components/feature/spec-sections";
import { SpecVersions, type VersionItem } from "@/components/feature/spec-versions";
import { GenerateSpecButton } from "@/components/feature/generate-spec-button";
import { ApproveSpecButton } from "@/components/feature/approve-spec-button";

export const dynamic = "force-dynamic";

export default async function SpecWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { projectId, featureId } = await params;
  const { version: viewingId } = await searchParams;
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

  const [repo, docs, versions] = await Promise.all([
    project.mode === "existing_system"
      ? getRepoByProjectId(project.id)
      : Promise.resolve(null),
    listContextDocsByProjectId(project.id),
    listSpecVersionsByFeatureId(feature.id),
  ]);
  const fileCount =
    repo?.fileTree?.entries.filter((e) => e.type === "file").length ?? 0;

  const versionItems: VersionItem[] = versions.map((v, i) => ({
    id: v.id,
    label: `v${versions.length - i}`,
    note: v.note,
    when: v.createdAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    isCurrent: i === 0,
  }));

  // Viewing a past version read-only?
  let viewing: { item: VersionItem; spec: ReturnType<typeof FeatureSpecSchema.parse> } | null =
    null;
  if (viewingId) {
    const v = await getSpecVersionById(viewingId);
    const item = versionItems.find((x) => x.id === viewingId);
    if (v && v.featureId === feature.id && item) {
      viewing = { item, spec: v.spec };
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
          <h1 className="text-2xl font-semibold tracking-tight">Spec</h1>
          {viewing ? (
            <Badge variant="secondary">viewing {viewing.item.label}</Badge>
          ) : hasSpec ? (
            <>
              <Badge variant="secondary">
                {versionItems[0]?.label ?? "v1"}
              </Badge>
              {isApproved ? (
                <span className="text-sm text-emerald-700 dark:text-emerald-400">
                  ✓ Approved
                </span>
              ) : null}
            </>
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
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            {viewing ? (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed p-3 text-sm">
                  <span className="text-muted-foreground">
                    Viewing {viewing.item.label} ({viewing.item.when}) —
                    read-only.
                  </span>
                  <Link
                    href={specHref}
                    className="underline transition-colors hover:text-foreground"
                  >
                    Back to current
                  </Link>
                </div>
                <SpecView spec={viewing.spec} />
              </>
            ) : hasSpec && spec ? (
              <>
                <SpecSections featureId={feature.id} spec={spec} />
                <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                  <GenerateSpecButton featureId={feature.id} hasSpec />
                  {!isApproved ? (
                    <ApproveSpecButton featureId={feature.id} />
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No spec yet. Generate one from the idea, Q&amp;A, and project
                  context.
                </div>
                <GenerateSpecButton featureId={feature.id} hasSpec={false} />
              </>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-14 lg:self-start">
            {versionItems.length > 0 ? (
              <SpecVersions
                featureId={feature.id}
                versions={versionItems}
                historyHref={`${hubHref}/history`}
              />
            ) : null}

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
