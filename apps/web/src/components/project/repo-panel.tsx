"use client";

import { useState, useTransition } from "react";
import type { RepoRecord } from "@repo/db";
import { shortStackLabel } from "@repo/repos";
import {
  disconnectRepoAction,
  refreshRepoAction,
} from "@/app/_actions/repo";
import { ConnectRepoForm } from "./connect-repo-form";

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function RepoPanel({
  projectId,
  repo,
}: {
  projectId: string;
  repo: RepoRecord | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshRepoAction({ projectId });
      if (!result.ok) setError(result.error.message);
    });
  };

  const handleDisconnect = () => {
    if (
      !confirm(
        "Disconnect repo? Future generations won't include code context. Existing specs and plans are unchanged.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await disconnectRepoAction({ projectId });
      if (!result.ok) setError(result.error.message);
    });
  };

  if (!repo) {
    return <ConnectRepoForm projectId={projectId} />;
  }

  const fileCount =
    repo.fileTree?.entries.filter((e) => e.type === "file").length ?? 0;
  const truncated = repo.fileTree?.truncated ?? false;
  const stackLabel = repo.conventions ? shortStackLabel(repo.conventions) : "";

  const btnCls =
    "rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900";

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {repo.owner}/{repo.repo}
            </span>
            <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {repo.defaultBranch}
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {fileCount} file{fileCount === 1 ? "" : "s"} indexed
            {truncated ? " (truncated at 5000)" : ""}
            {repo.lastIndexedAt
              ? ` · last refreshed ${formatRelative(repo.lastIndexedAt)}`
              : ""}
          </div>
          {stackLabel ? (
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
              <span className="text-neutral-400 dark:text-neutral-500">
                Detected:
              </span>{" "}
              {stackLabel}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className={btnCls}
          >
            {isPending ? "Working…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isPending}
            className={btnCls}
          >
            Disconnect
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
