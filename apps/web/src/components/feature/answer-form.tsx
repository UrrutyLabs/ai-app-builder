"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AnswerListSchema,
  type Answer,
  type Question,
} from "@repo/domain/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    const result = await saveAnswersAction({
      featureId,
      answers: values.answers,
    });
    if (result && !result.ok) toast.error(result.error.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ol className="space-y-5">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-2">
            <div className="flex gap-3">
              <span className="font-mono text-muted-foreground">{i + 1}.</span>
              <Label htmlFor={`answer-${q.id}`}>{q.text}</Label>
            </div>
            <input
              type="hidden"
              {...register(`answers.${i}.questionId`)}
              value={q.id}
            />
            <Textarea
              id={`answer-${q.id}`}
              {...register(`answers.${i}.text`)}
              rows={2}
              className="ml-6 w-[calc(100%-1.5rem)]"
              placeholder="Your answer…"
            />
            {errors.answers?.[i]?.text ? (
              <p className="ml-6 text-sm text-destructive">
                {errors.answers[i]?.text?.message}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save answers"}
        </Button>
      </div>
    </form>
  );
}
