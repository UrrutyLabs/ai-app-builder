import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Circle, CircleCheck, CircleDot, Lock } from "lucide-react";
import {
  countSpecVersionsByFeatureId,
  getFeatureById,
  getProjectByIdForUser,
} from "@repo/db";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  ImplementationPlanSchema,
  QuestionListSchema,
} from "@repo/domain/schemas";
import { getCurrentUser } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { GenerateQuestionsButton } from "@/components/feature/generate-questions-button";
import { AnswerForm } from "@/components/feature/answer-form";
import { ExportButtons } from "@/components/feature/export-buttons";
import { TranscriptContextView } from "@/components/feature/transcript-context-view";
import { CollapsibleStage } from "@/components/feature/collapsible-stage";
import { parseTranscriptContext } from "@/lib/transcript-context";

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
  const transcriptContext = parseTranscriptContext(feature.transcriptContext);

  const hasQuestions = !!questions && questions.length > 0;
  const hasAnswers = !!answers && answers.length > 0;
  const hasSpec = !!spec;
  const hasPlan = !!plan;
  const isApproved = !!feature.approvedAt;
  const editingAnswers = edit === "answers";

  const versionCount = await countSpecVersionsByFeatureId(feature.id);

  const hubHref = `/projects/${project.id}/features/${feature.id}`;

  const showAnswerForm =
    hasQuestions &&
    (feature.status === "QUESTIONS_GENERATED" || editingAnswers);

  // Stage states + one-line summaries for the map.
  const qaState: StageState = hasAnswers ? "done" : "active";
  const qaSummary = !hasQuestions
    ? "Not started — generate clarifying questions"
    : hasAnswers
      ? `${questions.length} questions · answered${feature.transcript ? " · from transcript" : ""}`
      : `${questions.length} questions · awaiting answers`;

  const specState: StageState = !hasAnswers
    ? "locked"
    : hasSpec
      ? "done"
      : "active";
  const specSummary = !hasAnswers
    ? "Answer the questions first"
    : hasSpec && spec
      ? `${spec.acceptanceCriteria.length} acceptance criteria${isApproved ? " · approved" : ""}${versionCount > 0 ? ` · v${versionCount}` : ""}`
      : "Not generated yet";

  const planState: StageState = !isApproved
    ? "locked"
    : hasPlan
      ? "done"
      : "active";
  const planSummary = !isApproved
    ? "Approve the spec first"
    : hasPlan && plan
      ? `${plan.fileChanges.length} file changes${feature.planStale ? " · spec changed — may be stale" : ""}`
      : "Not generated yet";

  const prState: StageState = !hasPlan
    ? "locked"
    : feature.prUrl
      ? "done"
      : "active";
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
        <CollapsibleStage
          label="Idea"
          summary={feature.idea}
          icon={<StageIcon state="done" />}
        >
          <p className="whitespace-pre-wrap text-sm">{feature.idea}</p>
          {transcriptContext ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Distilled from the refinement transcript — fed into every
                downstream step.
              </p>
              <TranscriptContextView context={transcriptContext} />
            </div>
          ) : null}
        </CollapsibleStage>

        <CollapsibleStage
          label="Q&A"
          summary={qaSummary}
          icon={<StageIcon state={qaState} />}
          defaultOpen={!hasAnswers || editingAnswers}
        >
          {!hasQuestions ? (
            <>
              <p className="text-sm text-muted-foreground">
                No questions yet — generate them below.
              </p>
              <GenerateQuestionsButton
                featureId={feature.id}
                hasQuestions={false}
              />
            </>
          ) : showAnswerForm ? (
            <>
              <AnswerForm
                featureId={feature.id}
                questions={questions}
                initialAnswers={answers ?? []}
              />
              <p className="text-xs text-muted-foreground">
                Regenerating questions will clear your answers.
              </p>
              <GenerateQuestionsButton featureId={feature.id} hasQuestions />
            </>
          ) : (
            <>
              <ol className="space-y-4 text-sm">
                {questions.map((q, i) => {
                  const a = answers?.find((x) => x.questionId === q.id);
                  return (
                    <li key={q.id} className="space-y-1">
                      <div className="flex gap-3">
                        <span className="font-mono text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="font-medium">{q.text}</span>
                      </div>
                      <p className="ml-6 whitespace-pre-wrap text-foreground/80">
                        {a ? (
                          a.text
                        ) : (
                          <span className="italic text-muted-foreground">
                            no answer
                          </span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <div className="flex items-center gap-3">
                <Link
                  href={`${hubHref}?edit=answers`}
                  className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  Edit answers
                </Link>
                <span className="text-muted-foreground/40">·</span>
                <GenerateQuestionsButton featureId={feature.id} hasQuestions />
              </div>
            </>
          )}
        </CollapsibleStage>

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
