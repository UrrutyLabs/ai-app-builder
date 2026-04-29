"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateProjectInputSchema,
  type UpdateProjectInput,
} from "@repo/domain/schemas";
import type { ProjectRecord } from "@repo/db";
import { updateProjectAction } from "@/app/_actions/projects";

export function EditProjectForm({ project }: { project: ProjectRecord }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectInputSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await updateProjectAction({
      ...values,
      description: values.description || null,
    });
    if (result && !result.ok) setServerError(result.error.message);
  });

  const inputCls =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" {...register("id")} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input id="name" {...register("name")} className={inputCls} />
        {errors.name ? (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className={inputCls}
        />
      </div>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
