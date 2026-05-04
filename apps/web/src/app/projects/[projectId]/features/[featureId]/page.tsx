import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFeatureById,
  getProjectById,
  getRepoByProjectId,
} from "@repo/db";
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

export default async function FeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { projectId, featureId } = await params;
  const { edit } = await searchParams;
  const [project, feature] = await Promise.all([
    getProjectById(projectId),
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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← {project.name}
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {feature.title}
        </h1>
        <span className="inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {feature.status.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Idea
        </h2>
        <p className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
          {feature.idea}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Clarifying questions
        </h2>

        {!hasQuestions ? (
          <>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Regenerating questions will clear your answers.
            </p>
            <GenerateQuestionsButton featureId={feature.id} hasQuestions />
          </>
        ) : null}

        {showAnsweredView ? (
          <>
            <ol className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
              {questions.map((q, i) => {
                const a = answers.find((x) => x.questionId === q.id);
                return (
                  <li key={q.id} className="space-y-1">
                    <div className="flex gap-3">
                      <span className="font-mono text-neutral-400">{i + 1}.</span>
                      <span className="font-medium">{q.text}</span>
                    </div>
                    <p className="ml-6 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                      {a ? a.text : <span className="italic text-neutral-400">no answer</span>}
                    </p>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${project.id}/features/${feature.id}?edit=answers`}
                className="text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Edit answers
              </Link>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <GenerateQuestionsButton featureId={feature.id} hasQuestions />
            </div>
          </>
        ) : null}
      </section>

      {hasAnswers && !editingAnswers ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
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
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  >
                    Edit spec
                  </Link>
                ) : null}

                {hasSpec && !isApproved ? (
                  <ApproveSpecButton featureId={feature.id} />
                ) : null}
              </div>

              {hasSpec ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Regenerating or editing the spec will clear approval and any implementation plan.
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {isApproved && !editingSpec ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Implementation plan
          </h2>
          {hasPlan ? <PlanView plan={plan} /> : null}
          <GeneratePlanButton featureId={feature.id} hasPlan={hasPlan} />
          {hasPlan ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Regenerating the plan will overwrite the current one.
            </p>
          ) : null}
        </section>
      ) : null}

      {hasPlan && project.mode === "existing_system" && !editingSpec ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Pull request
          </h2>
          {feature.prUrl ? (
            <p className="text-sm">
              <span className="text-emerald-700 dark:text-emerald-400">
                ✓ PR opened
              </span>{" "}
              ·{" "}
              <a
                href={feature.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {feature.prUrl}
              </a>
              {feature.prCreatedAt
                ? ` · ${feature.prCreatedAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : ""}
            </p>
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
        <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Export
          </h2>
          <ExportButtons featureId={feature.id} />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Includes the idea, Q&amp;A, spec, and plan as currently saved.
          </p>
        </section>
      ) : null}
    </div>
  );
}
