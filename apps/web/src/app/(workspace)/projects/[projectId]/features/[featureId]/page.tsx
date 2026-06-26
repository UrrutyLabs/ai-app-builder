import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Circle, CircleCheck, CircleDot, Lock } from "lucide-react";
import {
  countSpecVersionsByFeatureId,
  getFeatureById,
  listDecisionsByFeature,
} from "@repo/db";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  ImplementationPlanSchema,
  QuestionListSchema,
} from "@repo/domain/schemas";
import { getMyProject } from "@/lib/auth/scope";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/feature/export-buttons";
import { deriveStageStates } from "@/lib/feature-stages";

export const dynamic = "force-dynamic";

type StageState = "done" | "active" | "todo" | "locked";

function StageIcon({ state }: { state: StageState }) {
  if (state === "done")
    return (
      <CircleCheck
        className="size-4 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      />
    );
  if (state === "active")
    return <CircleDot className="size-4 text-primary" aria-hidden="true" />;
  if (state === "locked")
    return <Lock className="size-4 text-muted-foreground" aria-hidden="true" />;
  return <Circle className="size-4 text-muted-foreground" aria-hidden="true" />;
}

function RowInner({
  state,
  label,
  summary,
}: {
  state: StageState;
  label: string;
  summary: string;
}) {
  return (
    <>
      <span className="shrink-0">
        <StageIcon state={state} />
      </span>
      <span className="w-12 shrink-0 text-sm font-medium">{label}</span>
      <span className="flex-1 truncate text-sm text-muted-foreground">
        {summary}
      </span>
    </>
  );
}

/** A stage that opens its own workspace route. Locked → non-interactive. */
function StageLinkRow({
  state,
  label,
  summary,
  href,
}: {
  state: StageState;
  label: string;
  summary: string;
  href: string;
}) {
  if (state === "locked") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3">
        <RowInner state={state} label={label} summary={summary} />
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <RowInner state={state} label={label} summary={summary} />
      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        Open
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default async function FeaturePage({
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

  const questions = feature.questions
    ? QuestionListSchema.parse(feature.questions)
    : null;
  const answers = feature.answers
    ? AnswerListSchema.parse(feature.answers)
    : null;
  const spec = feature.spec ? FeatureSpecSchema.parse(feature.spec) : null;
  const plan = feature.plan
    ? ImplementationPlanSchema.parse(feature.plan)
    : null;
  const decisionRecords = await listDecisionsByFeature(feature.id);
  const openDecisionCount = decisionRecords.filter(
    (d) => d.status === "OPEN",
  ).length;
  const ideaSummary =
    decisionRecords.length === 0
      ? "Review the idea · add decisions"
      : `${decisionRecords.length} decision${
          decisionRecords.length === 1 ? "" : "s"
        }${openDecisionCount > 0 ? ` · ${openDecisionCount} open` : ""}`;

  const hasQuestions = !!questions && questions.length > 0;
  const hasAnswers = !!answers && answers.length > 0;
  const hasSpec = !!spec;
  const hasPlan = !!plan;
  const isApproved = !!feature.approvedAt;

  const versionCount = await countSpecVersionsByFeatureId(feature.id);

  const hubHref = `/projects/${project.id}/features/${feature.id}`;

  // Stage states + one-line summaries for the map. States come from the shared
  // helper so the hub and the per-page stepper always agree.
  const stages = deriveStageStates(feature);
  const stateOf = (key: string): StageState =>
    stages.find((s) => s.key === key)?.state ?? "active";
  const qaState = stateOf("qa");
  const qaSummary = !hasQuestions
    ? "Not started — generate clarifying questions"
    : hasAnswers
      ? `${questions.length} questions · answered${feature.transcript ? " · from transcript" : ""}`
      : `${questions.length} questions · awaiting answers`;

  const specState = stateOf("spec");
  const specSummary = !hasAnswers
    ? "Answer the questions first"
    : hasSpec && spec
      ? `${spec.acceptanceCriteria.length} acceptance criteria${isApproved ? " · approved" : ""}${versionCount > 0 ? ` · v${versionCount}` : ""}`
      : "Not generated yet";

  const planState = stateOf("plan");
  const planSummary = !isApproved
    ? "Approve the spec first"
    : hasPlan && plan
      ? `${plan.fileChanges.length} file changes${feature.planStale ? " · spec changed — may be stale" : ""}`
      : "Not generated yet";

  const prState = stateOf("pr");
  const prSummary = !hasPlan
    ? "Generate a plan first"
    : feature.prUrl
      ? "Pull request opened"
      : "Ready to open";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-3">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {feature.title}
          </h1>
          <Badge variant="outline">
            {feature.status.replace(/_/g, " ").toLowerCase()}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <StageLinkRow
          state="done"
          label="Idea"
          summary={ideaSummary}
          href={`${hubHref}/idea`}
        />

        <StageLinkRow
          state={qaState}
          label="Q&A"
          summary={qaSummary}
          href={`${hubHref}/qa`}
        />

        <StageLinkRow
          state={specState}
          label="Spec"
          summary={specSummary}
          href={`${hubHref}/spec`}
        />

        <StageLinkRow
          state={planState}
          label="Plan"
          summary={planSummary}
          href={`${hubHref}/plan`}
        />

        {project.mode === "existing_system" ? (
          <StageLinkRow
            state={prState}
            label="PR"
            summary={prSummary}
            href={`${hubHref}/pr`}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-sm text-muted-foreground">
          Export this feature
        </span>
        <ExportButtons featureId={feature.id} />
      </div>
    </div>
  );
}
