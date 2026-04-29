"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AnswerListSchema,
  type Answer,
  type Question,
} from "@repo/domain/schemas";
import { saveAnswersAction } from "@/app/_actions/answers";

const FormSchema = z.object({
  answers: AnswerListSchema,
});

type FormValues = z.infer<typeof FormSchema>;

export function AnswerForm({
  featureId,
  questions,
  initialAnswers,
}: {
  featureId: string;
  questions: Question[];
  initialAnswers: Answer[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const initialMap = new Map(initialAnswers.map((a) => [a.questionId, a.text]));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      answers: questions.map((q) => ({
        questionId: q.id,
        text: initialMap.get(q.id) ?? "",
      })),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await saveAnswersAction({ featureId, answers: values.answers });
    if (result && !result.ok) setServerError(result.error.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ol className="space-y-5">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-2">
            <div className="flex gap-3">
              <span className="font-mono text-neutral-400">{i + 1}.</span>
              <label
                htmlFor={`answer-${q.id}`}
                className="text-sm font-medium"
              >
                {q.text}
              </label>
            </div>
            <input
              type="hidden"
              {...register(`answers.${i}.questionId`)}
              value={q.id}
            />
            <textarea
              id={`answer-${q.id}`}
              {...register(`answers.${i}.text`)}
              rows={2}
              className="ml-6 w-[calc(100%-1.5rem)] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="Your answer…"
            />
            {errors.answers?.[i]?.text ? (
              <p className="ml-6 text-sm text-red-600">
                {errors.answers[i]?.text?.message}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Saving…" : "Save answers"}
        </button>
      </div>
    </form>
  );
}
