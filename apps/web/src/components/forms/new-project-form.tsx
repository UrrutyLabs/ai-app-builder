"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProjectInputSchema,
  type CreateProjectInput,
} from "@repo/domain/schemas";
import { createProjectAction } from "@/app/_actions/projects";

export function NewProjectForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectInputSchema),
    defaultValues: { name: "", mode: "greenfield", description: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createProjectAction({
      ...values,
      description: values.description || null,
    });
    if (result && !result.ok) {
      setServerError(result.error.message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          {...register("name")}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="My new project"
        />
        {errors.name ? (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Mode</legend>
        <div className="space-y-2">
          <label className="flex items-start gap-3">
            <input
              type="radio"
              value="greenfield"
              {...register("mode")}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Greenfield</span>
              <span className="block text-neutral-500 dark:text-neutral-400">
                New project, no existing code constraints.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="radio"
              value="existing_system"
              {...register("mode")}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Existing system</span>
              <span className="block text-neutral-500 dark:text-neutral-400">
                Feature on top of an existing codebase.
              </span>
            </span>
          </label>
        </div>
        {errors.mode ? (
          <p className="text-sm text-red-600">{errors.mode.message}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="What is this project about?"
        />
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
          {isSubmitting ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}
