"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateFeatureInputSchema,
  type CreateFeatureInput,
} from "@repo/domain/schemas";
import { createFeatureAction } from "@/app/_actions/features";

export function NewFeatureForm({ projectId }: { projectId: string }) {
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
