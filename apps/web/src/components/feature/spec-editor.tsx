"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FeatureSpec } from "@repo/domain/schemas";
import { saveSpecAction } from "@/app/_actions/spec";

const FormSchema = z.object({
  title: z.string().min(1).max(120),
  problem: z.string().min(1),
  goal: z.string().min(1),
  mode: z.enum(["greenfield", "existing_system"]),
  scopeIn: z.string(),
  scopeOut: z.string(),
  actors: z.string(),
  userFlows: z.string(),
  uiStates: z.string(),
  businessRules: z.string(),
  dataChanges: z.string(),
  apiChanges: z.string(),
  acceptanceCriteria: z.string(),
  assumptions: z.string(),
  openQuestions: z.string(),
});

type FormValues = z.infer<typeof FormSchema>;

const linesToArray = (s: string): string[] =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const arrayToLines = (a: string[]): string => a.join("\n");

function specToFormValues(spec: FeatureSpec): FormValues {
  return {
    title: spec.title,
    problem: spec.problem,
    goal: spec.goal,
    mode: spec.mode,
    scopeIn: arrayToLines(spec.scope.in),
    scopeOut: arrayToLines(spec.scope.out),
    actors: arrayToLines(spec.actors),
    userFlows: arrayToLines(spec.userFlows),
    uiStates: arrayToLines(spec.uiStates),
    businessRules: arrayToLines(spec.businessRules),
    dataChanges: arrayToLines(spec.dataChanges),
    apiChanges: arrayToLines(spec.apiChanges),
    acceptanceCriteria: arrayToLines(spec.acceptanceCriteria),
    assumptions: arrayToLines(spec.assumptions),
    openQuestions: arrayToLines(spec.openQuestions),
  };
}

function formValuesToSpec(v: FormValues): FeatureSpec {
  return {
    title: v.title,
    problem: v.problem,
    goal: v.goal,
    mode: v.mode,
    scope: { in: linesToArray(v.scopeIn), out: linesToArray(v.scopeOut) },
    actors: linesToArray(v.actors),
    userFlows: linesToArray(v.userFlows),
    uiStates: linesToArray(v.uiStates),
    businessRules: linesToArray(v.businessRules),
    dataChanges: linesToArray(v.dataChanges),
    apiChanges: linesToArray(v.apiChanges),
    acceptanceCriteria: linesToArray(v.acceptanceCriteria),
    assumptions: linesToArray(v.assumptions),
    openQuestions: linesToArray(v.openQuestions),
  };
}

const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950";

function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      {hint ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>
      ) : null}
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function SpecEditor({
  featureId,
  projectId,
  spec,
}: {
  featureId: string;
  projectId: string;
  spec: FeatureSpec;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: specToFormValues(spec),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await saveSpecAction({
      featureId,
      spec: formValuesToSpec(values),
    });
    if (result && !result.ok) setServerError(result.error.message);
  });

  const linesHint = "One item per line. Empty lines are ignored.";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <Field label="Title" error={errors.title?.message}>
        <input {...register("title")} className={inputCls} />
      </Field>

      <Field label="Mode">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="greenfield" {...register("mode")} />
            Greenfield
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="existing_system"
              {...register("mode")}
            />
            Existing system
          </label>
        </div>
      </Field>

      <Field label="Problem" error={errors.problem?.message}>
        <textarea {...register("problem")} rows={3} className={inputCls} />
      </Field>

      <Field label="Goal" error={errors.goal?.message}>
        <textarea {...register("goal")} rows={3} className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="In scope" hint={linesHint}>
          <textarea {...register("scopeIn")} rows={4} className={inputCls} />
        </Field>
        <Field label="Out of scope" hint={linesHint}>
          <textarea {...register("scopeOut")} rows={4} className={inputCls} />
        </Field>
      </div>

      <Field label="Actors" hint={linesHint}>
        <textarea {...register("actors")} rows={3} className={inputCls} />
      </Field>

      <Field label="User flows" hint={linesHint}>
        <textarea {...register("userFlows")} rows={4} className={inputCls} />
      </Field>

      <Field label="UI states" hint={linesHint}>
        <textarea {...register("uiStates")} rows={4} className={inputCls} />
      </Field>

      <Field label="Business rules" hint={linesHint}>
        <textarea {...register("businessRules")} rows={4} className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data changes" hint={linesHint}>
          <textarea {...register("dataChanges")} rows={4} className={inputCls} />
        </Field>
        <Field label="API changes" hint={linesHint}>
          <textarea {...register("apiChanges")} rows={4} className={inputCls} />
        </Field>
      </div>

      <Field label="Acceptance criteria" hint={linesHint}>
        <textarea
          {...register("acceptanceCriteria")}
          rows={5}
          className={inputCls}
        />
      </Field>

      <Field label="Assumptions" hint={linesHint}>
        <textarea {...register("assumptions")} rows={3} className={inputCls} />
      </Field>

      <Field label="Open questions" hint={linesHint}>
        <textarea {...register("openQuestions")} rows={3} className={inputCls} />
      </Field>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Saving the spec resets approval and clears any implementation plan.
      </p>

      <div className="flex justify-end gap-3">
        <Link
          href={`/projects/${projectId}/features/${featureId}`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Saving…" : "Save spec"}
        </button>
      </div>
    </form>
  );
}
