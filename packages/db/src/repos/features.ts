import type {
  Feature as PrismaFeature,
  FeatureStatus,
  Prisma,
} from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  ImplementationPlanSchema,
  QuestionListSchema,
  TranscriptContextSchema,
  type Answer,
  type FeatureSpec,
  type ImplementationPlan,
  type Question,
  type TranscriptContext,
} from "@repo/domain/schemas";
import { prisma } from "../client";

export type { FeatureStatus };

export type FeatureRecord = {
  id: string;
  projectId: string;
  title: string;
  idea: string;
  status: FeatureStatus;
  questions: Prisma.JsonValue | null;
  answers: Prisma.JsonValue | null;
  spec: Prisma.JsonValue | null;
  plan: Prisma.JsonValue | null;
  approvedAt: Date | null;
  planStale: boolean;
  prUrl: string | null;
  prCreatedAt: Date | null;
  transcript: string | null;
  transcriptContext: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const toRecord = (f: PrismaFeature): FeatureRecord => ({
  id: f.id,
  projectId: f.projectId,
  title: f.title,
  idea: f.idea,
  status: f.status,
  questions: f.questions,
  answers: f.answers,
  spec: f.spec,
  plan: f.plan,
  approvedAt: f.approvedAt,
  planStale: f.planStale,
  prUrl: f.prUrl,
  prCreatedAt: f.prCreatedAt,
  transcript: f.transcript,
  transcriptContext: f.transcriptContext,
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});

export async function createFeature(input: {
  projectId: string;
  title: string;
  idea: string;
}): Promise<FeatureRecord> {
  const row = await prisma.feature.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      idea: input.idea,
    },
  });
  return toRecord(row);
}

export async function createFeatureFromTranscript(input: {
  projectId: string;
  title: string;
  idea: string;
  transcript: string;
  transcriptContext: TranscriptContext;
}): Promise<FeatureRecord> {
  const validated = TranscriptContextSchema.parse(input.transcriptContext);
  const row = await prisma.feature.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      idea: input.idea,
      transcript: input.transcript,
      transcriptContext: validated as Prisma.InputJsonValue,
    },
  });
  return toRecord(row);
}

export async function listFeaturesByProject(
  projectId: string,
): Promise<FeatureRecord[]> {
  const rows = await prisma.feature.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getFeatureById(id: string): Promise<FeatureRecord | null> {
  const row = await prisma.feature.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function setFeatureQuestions(
  featureId: string,
  questions: Question[],
): Promise<FeatureRecord> {
  const validated = QuestionListSchema.parse(questions);
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      // Question[] is structurally a Prisma.InputJsonValue but the types don't unify.
      questions: validated as Prisma.InputJsonValue,
      // Re-running questions invalidates everything downstream (architecture.md §4).
      answers: PrismaNS.DbNull,
      spec: PrismaNS.DbNull,
      plan: PrismaNS.DbNull,
      approvedAt: null,
      status: "QUESTIONS_GENERATED",
    },
  });
  return toRecord(row);
}

export async function setFeatureAnswers(
  featureId: string,
  answers: Answer[],
): Promise<FeatureRecord> {
  const validated = AnswerListSchema.parse(answers);
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      answers: validated as Prisma.InputJsonValue,
      // Re-running answers invalidates spec/plan.
      spec: PrismaNS.DbNull,
      plan: PrismaNS.DbNull,
      approvedAt: null,
      status: "ANSWERED",
    },
  });
  return toRecord(row);
}

export async function setFeatureSpec(
  featureId: string,
  spec: FeatureSpec,
  note?: string,
): Promise<FeatureRecord> {
  const validated = FeatureSpecSchema.parse(spec);
  // Atomic: feature update + version snapshot. Each setFeatureSpec call adds
  // one row to SpecVersion (history of every save).
  //
  // Editing the spec keeps any generated plan but marks it stale and clears
  // approval — so a small edit no longer destroys downstream work; you just
  // re-approve (and optionally regenerate the now-stale plan). See CLAUDE.md.
  const [row] = await prisma.$transaction([
    prisma.feature.update({
      where: { id: featureId },
      data: {
        spec: validated as Prisma.InputJsonValue,
        approvedAt: null,
        planStale: true,
        status: "SPEC_DRAFTED",
      },
    }),
    prisma.specVersion.create({
      data: {
        featureId,
        spec: validated as Prisma.InputJsonValue,
        ...(note !== undefined ? { note } : {}),
      },
    }),
  ]);
  return toRecord(row);
}

export async function approveFeatureSpec(
  featureId: string,
): Promise<FeatureRecord> {
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      approvedAt: new Date(),
      status: "SPEC_APPROVED",
    },
  });
  return toRecord(row);
}

export async function setFeaturePlan(
  featureId: string,
  plan: ImplementationPlan,
): Promise<FeatureRecord> {
  const validated = ImplementationPlanSchema.parse(plan);
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      plan: validated as Prisma.InputJsonValue,
      planStale: false,
      status: "PLAN_GENERATED",
    },
  });
  return toRecord(row);
}

export async function setFeaturePr(
  featureId: string,
  url: string,
): Promise<FeatureRecord> {
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      prUrl: url,
      prCreatedAt: new Date(),
    },
  });
  return toRecord(row);
}
