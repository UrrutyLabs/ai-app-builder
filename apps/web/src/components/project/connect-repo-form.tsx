"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConnectRepoInputSchema,
  type ConnectRepoInput,
} from "@repo/domain/schemas";
import { connectRepoAction } from "@/app/_actions/repo";

export function ConnectRepoForm({ projectId }: { projectId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnectRepoInput>({
    resolver: zodResolver(ConnectRepoInputSchema),
    defaultValues: { projectId, repoUrl: "", pat: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await connectRepoAction(values);
    if (result && !result.ok) setServerError(result.error.message);
  });

  const inputCls =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700"
    >
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <label htmlFor="repoUrl" className="text-sm font-medium">
          GitHub repo URL
        </label>
        <input
          id="repoUrl"
          {...register("repoUrl")}
          placeholder="https://github.com/owner/repo"
          className={inputCls}
        />
        {errors.repoUrl ? (
          <p className="text-sm text-red-600">{errors.repoUrl.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="pat" className="text-sm font-medium">
          Personal access token
        </label>
        <input
          id="pat"
          type="password"
          {...register("pat")}
          placeholder="ghp_..."
          className={inputCls}
          autoComplete="off"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Create a PAT with <code>repo</code> scope (or <code>public_repo</code>{" "}
          for public repos). Stored encrypted at rest.
        </p>
        {errors.pat ? (
          <p className="text-sm text-red-600">{errors.pat.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Connecting…" : "Connect repo"}
        </button>
      </div>
    </form>
  );
}
