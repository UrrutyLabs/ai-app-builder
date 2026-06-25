import Link from "next/link";
import { notFound } from "next/navigation";
import { Files, FileText, FolderGit2, Mic } from "lucide-react";
import {
  getFeatureById,
  getRepoByProjectId,
  listContextDocsByProjectId,
  listDecisionsByFeature,
} from "@repo/db";
import { getMyProject } from "@/lib/auth/scope";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DecisionsPanel,
  type DecisionLite,
} from "@/components/feature/decisions-panel";

export const dynamic = "force-dynamic";

function sourceLabel(
  sourceType: DecisionLite["sourceType"],
  sourceId: string | null,
  docTitleById: Map<string, string>,
): string {
  switch (sourceType) {
    case "CONTEXT_DOC":
      return docTitleById.get(sourceId ?? "") ?? "document";
    case "TRANSCRIPT":
      return "transcript";
    case "HUMAN_EDIT":
      return "you";
    case "AI_PROPOSAL":
      return "AI";
    case "CLARIFYING_ANSWER":
      return "answer";
  }
}

export default async function FeatureIdeaPage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = await params;
  const [project, feature] = await Promise.all([
    getMyProject(projectId),
    getFeatureById(featureId),
  ]);
  if (!project || !feature || feature.projectId !== project.id) notFound();

  const hubHref = `/projects/${project.id}/features/${feature.id}`;

  const [decisionRecords, docs, repo] = await Promise.all([
    listDecisionsByFeature(feature.id),
    listContextDocsByProjectId(project.id),
    project.mode === "existing_system"
      ? getRepoByProjectId(project.id)
      : Promise.resolve(null),
  ]);
  const docTitleById = new Map(docs.map((d) => [d.id, d.title]));

  const decisions: DecisionLite[] = decisionRecords.map((d) => ({
    id: d.id,
    kind: d.kind,
    status: d.status,
    statement: d.statement,
    sourceType: d.sourceType,
    sourceLabel: sourceLabel(d.sourceType, d.sourceId, docTitleById),
  }));

  const docDecision = decisionRecords.find(
    (d) => d.sourceType === "CONTEXT_DOC",
  );
  const source = feature.transcript
    ? { icon: <Mic className="size-3.5" aria-hidden="true" />, label: "From transcript" }
    : docDecision
      ? {
          icon: <FileText className="size-3.5" aria-hidden="true" />,
          label: `From document · ${docTitleById.get(docDecision.sourceId ?? "") ?? "document"}`,
        }
      : null;

  const openCount = decisionRecords.filter((d) => d.status === "OPEN").length;

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
            Idea &amp; decisions
          </h1>
          {source ? (
            <Badge variant="secondary" className="gap-1.5">
              {source.icon}
              {source.label}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-5">
          <div className="space-y-2 rounded-lg border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Idea
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {feature.idea}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                Decisions{" "}
                <span className="font-normal text-muted-foreground">
                  · {decisionRecords.length}
                </span>
              </h2>
              {openCount > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {openCount} open
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              These ground the questions, spec, and plan. Accept, reject, or add
              your own.
            </p>
            <DecisionsPanel featureId={feature.id} decisions={decisions} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-14 lg:self-start">
          <Link href={hubHref} className={buttonVariants({ size: "sm" })}>
            Continue to questions
          </Link>

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
                  <span>
                    {repo ? `${repo.owner}/${repo.repo}` : "No repo connected"}
                  </span>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <Files
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {docs.length} context doc{docs.length === 1 ? "" : "s"}
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
