import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  FolderGit2,
  GitPullRequest,
  History,
  Lock,
  Mic,
} from "lucide-react";
import {
  countSpecVersionsByFeatureId,
  getEncryptedTokenForProject,
  getFeatureById,
  getProjectByIdForUser,
  getRepoByProjectId,
  listContextDocsByProjectId,
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
import {
  FeatureStepper,
  type Stage,
} from "@/components/feature/feature-stepper";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function LockedNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <Lock className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </div>
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
  // approvedAt persists through PLAN_GENERATED (only re-running the spec clears
  // it), so it — not the status enum — is the durable "spec approved" signal.
  const isApproved = !!feature.approvedAt;

  const editingAnswers = edit === "answers";
  const editingSpec = edit === "spec" && hasSpec;

  // Focused editing view — drop the pipeline chrome to keep the editor central.
  if (editingSpec && spec) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href={`/projects/${project.id}/features/${feature.id}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {feature.title}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit spec</h1>
        <SpecEditor
          featureId={feature.id}
          projectId={project.id}
          spec={spec}
        />
      </div>
    );
  }

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

  const [docs, versionCount] = await Promise.all([
    listContextDocsByProjectId(project.id),
    countSpecVersionsByFeatureId(feature.id),
  ]);

  const showAnswerForm =
    hasQuestions &&
    (feature.status === "QUESTIONS_GENERATED" || editingAnswers);
  const showAnsweredView = hasQuestions && hasAnswers && !editingAnswers;

  // Best-effort PR status (open/merged/closed). Cached 5s in-process.
  let prStatus: PrStatus | null = null;
  if (feature.prUrl && repo) {
    const encrypted = await getEncryptedTokenForProject(project.id);
    if (encrypted) {
      try {
        prStatus = await fetchPrStatus(feature.prUrl, decryptToken(encrypted));
      } catch (err) {
        console.error("[FeaturePage] PR status fetch failed:", err);
      }
    }
  }

  const stages: Stage[] = [
    { id: "idea", label: "Idea", state: "done" },
    { id: "questions", label: "Q&A", state: hasAnswers ? "done" : "active" },
    {
      id: "spec",
      label: "Spec",
      state: !hasAnswers ? "locked" : hasSpec ? "done" : "active",
    },
    {
      id: "plan",
      label: "Plan",
      state: !isApproved ? "locked" : hasPlan ? "done" : "active",
    },
  ];
  if (project.mode === "existing_system") {
    stages.push({
      id: "pr",
      label: "PR",
      state: !hasPlan ? "locked" : feature.prUrl ? "done" : "active",
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
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

      <FeatureStepper stages={stages} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-10">
          <section id="idea" className="scroll-mt-20 space-y-3">
            <SectionHeading>Idea</SectionHeading>
            <p className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
              {feature.idea}
            </p>
            {transcriptContext ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Distilled from the refinement transcript — fed into every
                  downstream step.
                </p>
                <TranscriptContextView context={transcriptContext} />
              </div>
            ) : null}
          </section>

          <section id="questions" className="scroll-mt-20 space-y-3">
            <SectionHeading>Clarifying questions</SectionHeading>

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

          <section id="spec" className="scroll-mt-20 space-y-3">
            <SectionHeading>Feature spec</SectionHeading>
            {!hasAnswers ? (
              <LockedNote>Answer the questions to generate a spec.</LockedNote>
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
              </>
            )}
          </section>

          <section id="plan" className="scroll-mt-20 space-y-3">
            <SectionHeading>Implementation plan</SectionHeading>
            {!isApproved ? (
              <LockedNote>Approve the spec to generate a plan.</LockedNote>
            ) : (
              <>
                {hasPlan ? <PlanView plan={plan} /> : null}
                <GeneratePlanButton featureId={feature.id} hasPlan={hasPlan} />
                {hasPlan ? (
                  <p className="text-xs text-muted-foreground">
                    Regenerating the plan overwrites the current one.
                  </p>
                ) : null}
              </>
            )}
          </section>

          {project.mode === "existing_system" ? (
            <section id="pr" className="scroll-mt-20 space-y-3">
              <SectionHeading>Pull request</SectionHeading>
              {!hasPlan ? (
                <LockedNote>
                  Generate a plan to open a pull request.
                </LockedNote>
              ) : (
                <>
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
                </>
              )}
            </section>
          ) : null}

          <section className="space-y-3 border-t pt-6">
            <SectionHeading>Export</SectionHeading>
            <ExportButtons featureId={feature.id} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-14 lg:self-start">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sources
          </div>
          <ul className="space-y-3 text-sm">
            {project.mode === "existing_system" ? (
              <li className="flex items-start gap-2">
                <FolderGit2
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {repo ? (
                  <span>
                    <span className="font-medium">
                      {repo.owner}/{repo.repo}
                    </span>
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
                <a href="#idea" className="hover:text-foreground">
                  From transcript
                </a>
              </li>
            ) : null}

            {versionCount > 0 ? (
              <li className="flex items-start gap-2">
                <History
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <Link
                  href={`/projects/${project.id}/features/${feature.id}/history`}
                  className="hover:text-foreground"
                >
                  {versionCount} spec version{versionCount === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}

            {project.mode === "existing_system" ? (
              <li className="flex items-start gap-2">
                <GitPullRequest
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {feature.prUrl ? (
                  <a
                    href={feature.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    View PR
                  </a>
                ) : (
                  <a href="#pr" className="text-muted-foreground hover:text-foreground">
                    No PR yet
                  </a>
                )}
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}
