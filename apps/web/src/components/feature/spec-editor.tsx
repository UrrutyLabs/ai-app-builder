"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { FeatureSpec } from "@repo/domain/schemas";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {hint ? (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      ) : null}
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function SpecEditor({
  featureId,
  projectId,
  spec,
  returnHref,
}: {
  featureId: string;
  projectId: string;
  spec: FeatureSpec;
  /** Where Cancel/Save return to. Defaults to the feature hub. */
  returnHref?: string;
}) {
  const router = useRouter();
  const destination =
    returnHref ?? `/projects/${projectId}/features/${featureId}`;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: specToFormValues(spec),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveSpecAction({
      featureId,
      spec: formValuesToSpec(values),
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Spec saved");
    router.push(destination);
    router.refresh();
  });

  const linesHint = "One item per line. Empty lines are ignored.";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-lg border bg-card p-6"
    >
      <Field label="Title" error={errors.title?.message}>
        <Input {...register("title")} />
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
        <Textarea {...register("problem")} rows={3} />
      </Field>

      <Field label="Goal" error={errors.goal?.message}>
        <Textarea {...register("goal")} rows={3} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="In scope" hint={linesHint}>
          <Textarea {...register("scopeIn")} rows={4} />
        </Field>
        <Field label="Out of scope" hint={linesHint}>
          <Textarea {...register("scopeOut")} rows={4} />
        </Field>
      </div>

      <Field label="Actors" hint={linesHint}>
        <Textarea {...register("actors")} rows={3} />
      </Field>

      <Field label="User flows" hint={linesHint}>
        <Textarea {...register("userFlows")} rows={4} />
      </Field>

      <Field label="UI states" hint={linesHint}>
        <Textarea {...register("uiStates")} rows={4} />
      </Field>

      <Field label="Business rules" hint={linesHint}>
        <Textarea {...register("businessRules")} rows={4} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data changes" hint={linesHint}>
          <Textarea {...register("dataChanges")} rows={4} />
        </Field>
        <Field label="API changes" hint={linesHint}>
          <Textarea {...register("apiChanges")} rows={4} />
        </Field>
      </div>

      <Field label="Acceptance criteria" hint={linesHint}>
        <Textarea {...register("acceptanceCriteria")} rows={5} />
      </Field>

      <Field label="Assumptions" hint={linesHint}>
        <Textarea {...register("assumptions")} rows={3} />
      </Field>

      <Field label="Open questions" hint={linesHint}>
        <Textarea {...register("openQuestions")} rows={3} />
      </Field>

      <p className="text-xs text-muted-foreground">
        Saving the spec resets approval and clears any implementation plan.
      </p>

      <div className="flex justify-end gap-3">
        <Link
          href={destination}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save spec"}
        </Button>
      </div>
    </form>
  );
}
