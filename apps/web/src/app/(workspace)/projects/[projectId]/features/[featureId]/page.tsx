import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEncryptedTokenForProject,
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
} from "@repo/db";
import { decryptToken } from "@repo/repos/server";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
import { fetchPrStatus, type PrStatus } from "@/lib/pr-status";
import { PrStatusBadge } from "@/components/feature/pr-status-badge";
import { countGeneratable, countScaffoldable } from "@/lib/scaffold-stubs";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  ImplementationPlanSchema,
  QuestionListSchema,
} from "@repo/domain/schemas";
import { GenerateQuestionsButton } from "@/components/feature/generate-questions-button";
import { AnswerForm } from "@/components/feature/answer-form";
import { GenerateSpecButton } from "@/components/feature/generate-spec-button";
import { SpecView } from "@/components/feature/spec-view";
import { SpecEditor } from "@/components/feature/spec-editor";
import { ApproveSpecButton } from "@/components/feature/approve-spec-button";
import { GeneratePlanButton } from "@/components/feature/generate-plan-button";
import { PlanView } from "@/components/feature/plan-view";
import { ExportButtons } from "@/components/feature/export-buttons";
import { CreatePrForm } from "@/components/feature/create-pr-form";
import { TranscriptContextView } from "@/components/feature/transcript-context-view";
import { parseTranscriptContext } from "@/lib/transcript-context";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

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

  const repo =
    project.mode === "existing_system"
      ? await getRepoByProjectId(project.id)
      : null;

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

  const existingPaths = new Set(
    repo?.fileTree?.entries
      .filter((e) => e.type === "file")
      .map((e) => e.path) ?? [],
  );
  const scaffoldableCount = plan
    ? countScaffoldable(plan, existingPaths)
    : 0;
  const generatable = plan
    ? countGeneratable(plan, existingPaths)
    : { creatable: 0, modifiable: 0, total: 0 };

  const editingAnswers = edit === "answers";
  const editingSpec = edit === "spec" && hasSpec;

  const showAnswerForm =
    hasQuestions && (feature.status === "QUESTIONS_GENERATED" || editingAnswers);
  const showAnsweredView = hasQuestions && hasAnswers && !editingAnswers;

  const isApproved = feature.status === "SPEC_APPROVED" && !!feature.approvedAt;

  // Best-effort fetch of PR status (open/merged/closed). Cached 5s in-process.
  let prStatus: PrStatus | null = null;
  if (feature.prUrl && repo) {
    const encrypted = await getEncryptedTokenForProject(project.id);
    if (encrypted) {
      try {
        const token = decryptToken(encrypted);
        prStatus = await fetchPrStatus(feature.prUrl, token);
      } catch (err) {
        console.error("[FeaturePage] PR status fetch failed:", err);
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {project.name}
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {feature.title}
        </h1>
        <Badge variant="outline">
          {feature.status.replace(/_/g, " ").toLowerCase()}
        </Badge>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Idea
        </h2>
        <p className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
          {feature.idea}
        </p>
      </section>

      {transcriptContext ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            From the transcript
          </h2>
          <p className="text-xs text-muted-foreground">
            Distilled from the refinement transcript. Review before generating
            questions — this context is fed into every downstream step.
          </p>
          <TranscriptContextView context={transcriptContext} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Clarifying questions
        </h2>

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
        ) : null}

        {showAnsweredView ? (
          <>
            <ol className="space-y-4 rounded-lg border bg-card p-4 text-sm">
              {questions.map((q, i) => {
                const a = answers.find((x) => x.questionId === q.id);
                return (
                  <li key={q.id} className="space-y-1">
                    <div className="flex gap-3">
                      <span className="font-mono text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{q.text}</span>
                    </div>
                    <p className="ml-6 whitespace-pre-wrap text-foreground/80">
                      {a ? a.text : <span className="italic text-muted-foreground">no answer</span>}
                    </p>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${project.id}/features/${feature.id}?edit=answers`}
                className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
              >
                Edit answers
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <GenerateQuestionsButton featureId={feature.id} hasQuestions />
            </div>
          </>
        ) : null}
      </section>

      {hasAnswers && !editingAnswers ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Feature spec
          </h2>

          {editingSpec ? (
            <SpecEditor
              featureId={feature.id}
              projectId={project.id}
              spec={spec}
            />
          ) : (
            <>
              {hasSpec ? <SpecView spec={spec} /> : null}

              {isApproved && feature.approvedAt ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  ✓ Approved on{" "}
                  {feature.approvedAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <GenerateSpecButton featureId={feature.id} hasSpec={hasSpec} />

                {hasSpec ? (
                  <Link
                    href={`/projects/${project.id}/features/${feature.id}?edit=spec`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Edit spec
                  </Link>
                ) : null}

                {hasSpec ? (
                  <Link
                    href={`/projects/${project.id}/features/${feature.id}/history`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    History
                  </Link>
                ) : null}

                {hasSpec && !isApproved ? (
                  <ApproveSpecButton featureId={feature.id} />
                ) : null}
              </div>

              {hasSpec ? (
                <p className="text-xs text-muted-foreground">
                  Regenerating or editing the spec will clear approval and any implementation plan.
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {isApproved && !editingSpec ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Implementation plan
          </h2>
          {hasPlan ? <PlanView plan={plan} /> : null}
          <GeneratePlanButton featureId={feature.id} hasPlan={hasPlan} />
          {hasPlan ? (
            <p className="text-xs text-muted-foreground">
              Regenerating the plan will overwrite the current one.
            </p>
          ) : null}
        </section>
      ) : null}

      {hasPlan && project.mode === "existing_system" && !editingSpec ? (
        <section className="space-y-3">
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

      {!editingSpec && !editingAnswers ? (
        <section className="space-y-3 border-t pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Export
          </h2>
          <ExportButtons featureId={feature.id} />
          <p className="text-xs text-muted-foreground">
            Includes the idea, Q&amp;A, spec, and plan as currently saved.
          </p>
        </section>
      ) : null}
    </div>
  );
}
