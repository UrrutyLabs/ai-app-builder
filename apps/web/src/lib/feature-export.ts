import type {
  Answer,
  FeatureSpec,
  ImplementationPlan,
  Question,
} from "@repo/domain/schemas";
import type { FeatureRecord, ProjectRecord } from "@repo/db";

export interface ExportInput {
  feature: FeatureRecord;
  project: ProjectRecord;
  questions: Question[] | null;
  answers: Answer[] | null;
  spec: FeatureSpec | null;
  plan: ImplementationPlan | null;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "feature"
  );
}

export function exportToJson(input: ExportInput): string {
  const payload = {
    project: {
      id: input.project.id,
      name: input.project.name,
      mode: input.project.mode,
      description: input.project.description,
    },
    feature: {
      id: input.feature.id,
      title: input.feature.title,
      idea: input.feature.idea,
      status: input.feature.status,
      approvedAt: input.feature.approvedAt
        ? input.feature.approvedAt.toISOString()
        : null,
      createdAt: input.feature.createdAt.toISOString(),
      updatedAt: input.feature.updatedAt.toISOString(),
    },
    questions: input.questions,
    answers: input.answers,
    spec: input.spec,
    plan: input.plan,
  };
  return JSON.stringify(payload, null, 2);
}
