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
  type Answer,
  type FeatureSpec,
  type ImplementationPlan,
  type Question,
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
  prUrl: string | null;
  prCreatedAt: Date | null;
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
  prUrl: f.prUrl,
  prCreatedAt: f.prCreatedAt,
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
): Promise<FeatureRecord> {
  const validated = FeatureSpecSchema.parse(spec);
  const row = await prisma.feature.update({
    where: { id: featureId },
    data: {
      spec: validated as Prisma.InputJsonValue,
      // Re-running spec invalidates plan + approval.
      plan: PrismaNS.DbNull,
      approvedAt: null,
      status: "SPEC_DRAFTED",
    },
  });
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
