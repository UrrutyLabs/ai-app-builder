"use client";

import { useState, useTransition } from "react";
import { createPrFromFeatureAction } from "@/app/_actions/pr";

const DEFAULT_SPEC_PATH = "docs/specs";
const DEFAULT_PLAN_PATH = "docs/plans";

type FileMode = "none" | "stubs" | "generate";

export function CreatePrForm({
  featureId,
  defaultSpecPath,
  defaultPlanPath,
  hasExistingPr,
  scaffoldableCount,
  generatableCreate,
  generatableModify,
}: {
  featureId: string;
  defaultSpecPath: string | null;
  defaultPlanPath: string | null;
  hasExistingPr: boolean;
  scaffoldableCount: number;
  generatableCreate: number;
  generatableModify: number;
}) {
  const generatableTotal = generatableCreate + generatableModify;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [specPath, setSpecPath] = useState(
    defaultSpecPath ?? DEFAULT_SPEC_PATH,
  );
  const [planPath, setPlanPath] = useState(
    defaultPlanPath ?? DEFAULT_PLAN_PATH,
  );
  const [fileMode, setFileMode] = useState<FileMode>(
    scaffoldableCount > 0 ? "stubs" : "none",
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPrFromFeatureAction({
        featureId,
        specPath,
        planPath,
        fileMode,
      });
      if (!result.ok) setError(result.error.message);
    });
  };

  const inputCls =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-mono shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950";

  const submittingLabel =
    fileMode === "generate" ? "Generating code & opening PR…" : "Opening PR…";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="specPath" className="text-xs font-medium">
            Spec directory
          </label>
          <input
            id="specPath"
            value={specPath}
            onChange={(e) => setSpecPath(e.target.value)}
            placeholder={DEFAULT_SPEC_PATH}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="planPath" className="text-xs font-medium">
            Plan directory
          </label>
          <input
            id="planPath"
            value={planPath}
            onChange={(e) => setPlanPath(e.target.value)}
            placeholder={DEFAULT_PLAN_PATH}
            className={inputCls}
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Spec and plan land at <code>{specPath}/&lt;slug&gt;.md</code> and{" "}
        <code>{planPath}/&lt;slug&gt;.md</code> on a new branch.
      </p>

      {generatableTotal > 0 ? (
        <fieldset className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <legend className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Plan touches {generatableTotal} file
            {generatableTotal === 1 ? "" : "s"}
            {generatableModify > 0
              ? ` (${generatableCreate} new, ${generatableModify} to modify)`
              : ""}
          </legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="fileMode"
              value="none"
              checked={fileMode === "none"}
              onChange={() => setFileMode("none")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Skip code files</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                Only commit the spec and plan markdown files.
              </span>
            </span>
          </label>
          {scaffoldableCount > 0 ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="fileMode"
                value="stubs"
                checked={fileMode === "stubs"}
                onChange={() => setFileMode("stubs")}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">
                  Scaffold {scaffoldableCount} empty stub
                  {scaffoldableCount === 1 ? "" : "s"}
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  Each new file gets a TODO header in the right comment syntax.
                  Fast, free. Modify actions are skipped in this mode.
                </span>
              </span>
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="fileMode"
              value="generate"
              checked={fileMode === "generate"}
              onChange={() => setFileMode("generate")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">
                Generate {generatableTotal} file
                {generatableTotal === 1 ? "" : "s"}
              </span>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                (~${(0.04 * generatableTotal).toFixed(2)}–$
                {(0.1 * generatableTotal).toFixed(2)},{" "}
                {Math.round(generatableTotal * 5)}–
                {Math.round(generatableTotal * 12)}s)
              </span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                AI writes new files and rewrites existing ones using the spec,
                your repo&apos;s conventions, and retrieved code context. Each
                file is syntax-checked with one repair attempt on failure.
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isPending
            ? submittingLabel
            : hasExistingPr
              ? "Open another PR"
              : "Open PR with spec & plan"}
        </button>
      </div>
    </form>
  );
}
