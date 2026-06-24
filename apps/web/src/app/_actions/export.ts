"use server";

import { z } from "zod";
import {
  AnswerListSchema,
  FeatureSpecSchema,
  ImplementationPlanSchema,
  QuestionListSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
import { NotFoundError } from "@repo/domain";
import { getFeatureById } from "@repo/db";
import { requireMyProject } from "@/lib/auth/scope";
import { toActionError } from "@/lib/action-error";
import {
  exportToJson,
  slugify,
  type ExportInput,
} from "@/lib/feature-export";
import { exportToMarkdown } from "@/lib/feature-markdown";

const InputSchema = z.object({
  featureId: z.string().min(1),
  format: z.enum(["json", "markdown"]),
});

export interface ExportPayload {
  filename: string;
  content: string;
  mimeType: string;
}

export async function exportFeatureAction(
  raw: unknown,
): Promise<ActionResult<ExportPayload>> {
  try {
    const { featureId, format } = InputSchema.parse(raw);

    const feature = await getFeatureById(featureId);
    if (!feature) throw new NotFoundError(`Feature ${featureId} not found`);

    const project = await requireMyProject(feature.projectId);

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

    const input: ExportInput = {
      feature,
      project,
      questions,
      answers,
      spec,
      plan,
    };

    const slug = slugify(feature.title);
    if (format === "json") {
      return {
        ok: true,
        data: {
          filename: `${slug}.json`,
          content: exportToJson(input),
          mimeType: "application/json",
        },
      };
    }
    return {
      ok: true,
      data: {
        filename: `${slug}.md`,
        content: exportToMarkdown(input),
        mimeType: "text/markdown",
      },
    };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
