import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeatureById } from "@repo/db";
import { AnswerListSchema, QuestionListSchema } from "@repo/domain/schemas";
import { getMyProject } from "@/lib/auth/scope";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GenerateQuestionsButton } from "@/components/feature/generate-questions-button";
import { AnswerForm } from "@/components/feature/answer-form";

export const dynamic = "force-dynamic";

export default async function FeatureQaPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { projectId, featureId } = await params;
  const { edit } = await searchParams;
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

  const hasQuestions = !!questions && questions.length > 0;
  const hasAnswers = !!answers && answers.length > 0;
  const editingAnswers = edit === "answers";
  const showAnswerForm =
    hasQuestions &&
    (feature.status === "QUESTIONS_GENERATED" || editingAnswers);

  const hubHref = `/projects/${project.id}/features/${feature.id}`;
  const qaHref = `${hubHref}/qa`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-3">
        <Link
          href={hubHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {feature.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Questions &amp; answers
          </h1>
          {hasQuestions ? (
            <Badge variant="secondary">
              {questions.length} question{questions.length === 1 ? "" : "s"}
              {hasAnswers ? " · answered" : ""}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Clarifying questions narrow the idea before the spec is written — your
          answers ground it.
        </p>
      </div>

      {!hasQuestions ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            No questions yet — generate them from the idea and its decisions.
          </p>
          <GenerateQuestionsButton featureId={feature.id} hasQuestions={false} />
        </div>
      ) : showAnswerForm ? (
        <div className="space-y-3">
          <AnswerForm
            featureId={feature.id}
            questions={questions}
            initialAnswers={answers ?? []}
          />
          <p className="text-xs text-muted-foreground">
            Regenerating questions will clear your answers.
          </p>
          <GenerateQuestionsButton featureId={feature.id} hasQuestions />
        </div>
      ) : (
        <div className="space-y-4">
          <ol className="space-y-4 rounded-lg border bg-card p-4 text-sm">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={`${qaHref}?edit=answers`}
                className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
              >
                Edit answers
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <GenerateQuestionsButton featureId={feature.id} hasQuestions />
            </div>
            <Link
              href={`${hubHref}/spec`}
              className={buttonVariants({ size: "sm" })}
            >
              Continue to spec
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
