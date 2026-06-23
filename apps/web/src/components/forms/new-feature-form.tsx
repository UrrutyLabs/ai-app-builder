"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateFeatureInputSchema,
  ExtractFromTranscriptInputSchema,
  type CreateFeatureInput,
  type ExtractFromTranscriptInput,
} from "@repo/domain/schemas";
import { createFeatureAction } from "@/app/_actions/features";
import { extractFromTranscriptAction } from "@/app/_actions/transcript";

type Mode = "idea" | "transcript";

export function NewFeatureForm({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("idea");

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-md border border-neutral-300 p-1 text-sm dark:border-neutral-700">
        <button
          type="button"
          onClick={() => setMode("idea")}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "idea"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          }`}
        >
          Type an idea
        </button>
        <button
          type="button"
          onClick={() => setMode("transcript")}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "transcript"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          }`}
        >
          Paste a transcript
        </button>
      </div>

      {mode === "idea" ? (
        <IdeaForm projectId={projectId} />
      ) : (
        <TranscriptForm projectId={projectId} />
      )}
    </div>
  );
}

function IdeaForm({ projectId }: { projectId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFeatureInput>({
    resolver: zodResolver(CreateFeatureInputSchema),
    defaultValues: { projectId, title: "", idea: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createFeatureAction(values);
    if (result && !result.ok) {
      setServerError(result.error.message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          {...register("title")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="Pickup notes on orders"
        />
        {errors.title ? (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="idea" className="text-sm font-medium">
          Idea
        </label>
        <textarea
          id="idea"
          {...register("idea")}
          rows={6}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="I want to add pickup notes to orders so drivers can see customer instructions…"
        />
        {errors.idea ? (
          <p className="text-sm text-red-600">{errors.idea.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Creating…" : "Create feature"}
        </button>
      </div>
    </form>
  );
}

function TranscriptForm({ projectId }: { projectId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExtractFromTranscriptInput>({
    resolver: zodResolver(ExtractFromTranscriptInputSchema),
    defaultValues: { projectId, transcript: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await extractFromTranscriptAction(values);
    if (result && !result.ok) {
      setServerError(result.error.message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <label htmlFor="transcript" className="text-sm font-medium">
          Refinement transcript
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Paste a meeting transcript. The system will distill it into a feature
          title, idea, and supporting context — you&apos;ll review everything
          before the pipeline runs.
        </p>
        <textarea
          id="transcript"
          {...register("transcript")}
          rows={16}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder={`Alice: I think we need pickup notes on orders so drivers know about customer requests…
Bob: Yeah, but only visible to drivers, not customers.
Alice: And it shouldn't require a migration if possible.
Bob: One question — should drivers be able to edit them after pickup?`}
        />
        {errors.transcript ? (
          <p className="text-sm text-red-600">{errors.transcript.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Extracting…" : "Extract feature from transcript"}
        </button>
      </div>
    </form>
  );
}
