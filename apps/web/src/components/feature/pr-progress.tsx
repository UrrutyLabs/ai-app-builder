"use client";

import type { PrEvent } from "@/lib/pr-events";

type RowState = "running" | "done" | "fail";

interface FileRow {
  path: string;
  action: "create" | "modify";
  index: number;
  total: number;
  state: RowState;
  ms?: number;
  verifyError?: string | null;
  repaired?: boolean;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusIcon({ state }: { state: RowState }) {
  if (state === "done")
    return <span className="text-emerald-600 dark:text-emerald-400">✓</span>;
  if (state === "fail")
    return <span className="text-amber-600 dark:text-amber-400">⚠</span>;
  return (
    <span className="inline-block animate-spin text-neutral-400">◐</span>
  );
}

export function PrProgress({
  events,
  isStreaming,
}: {
  events: PrEvent[];
  isStreaming: boolean;
}) {
  // Reduce events into structured state.
  const steps: string[] = [];
  const fileMap = new Map<string, FileRow>();
  let committing: number | null = null;
  let prUrl: string | null = null;
  let prNumber: number | null = null;
  let unverified: string[] = [];
  let errorMsg: string | null = null;

  for (const e of events) {
    switch (e.type) {
      case "step":
        steps.push(e.label);
        break;
      case "file-start":
        fileMap.set(e.path, {
          path: e.path,
          action: e.action,
          index: e.index,
          total: e.total,
          state: "running",
        });
        break;
      case "file-complete": {
        const prev = fileMap.get(e.path);
        if (prev) {
          fileMap.set(e.path, {
            ...prev,
            state: e.verified ? "done" : "fail",
            ms: e.ms,
            verifyError: e.verifyError,
            repaired: e.repaired,
          });
        }
        break;
      }
      case "committing":
        committing = e.total;
        break;
      case "pr-opened":
        prUrl = e.url;
        prNumber = e.number;
        unverified = e.unverifiedFiles;
        break;
      case "error":
        errorMsg = `[${e.code}] ${e.message}`;
        break;
    }
  }

  const fileRows = [...fileMap.values()].sort(
    (a, b) => a.index - b.index,
  );

  if (events.length === 0 && !isStreaming) return null;

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      {steps.map((s, i) => (
        <div key={`step-${i}`} className="flex items-center gap-2">
          <StatusIcon state="done" />
          <span>{s}</span>
        </div>
      ))}

      {fileRows.map((row) => (
        <div key={row.path} className="flex items-start gap-2">
          <StatusIcon state={row.state} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-xs">{row.path}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ({row.action})
              </span>
              {row.ms !== undefined ? (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  · {formatMs(row.ms)}
                </span>
              ) : null}
              {row.repaired ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  · repaired
                </span>
              ) : null}
            </div>
            {row.state === "fail" && row.verifyError ? (
              <div className="mt-0.5 truncate text-xs text-amber-700 dark:text-amber-300">
                {row.verifyError.split("\n")[0]}
              </div>
            ) : null}
          </div>
        </div>
      ))}

      {committing !== null && !prUrl && !errorMsg ? (
        <div className="flex items-center gap-2">
          <StatusIcon state="running" />
          <span>
            Committing {committing} file{committing === 1 ? "" : "s"} and
            opening PR
          </span>
        </div>
      ) : null}

      {prUrl ? (
        <div className="flex items-start gap-2">
          <StatusIcon state="done" />
          <div>
            <span className="text-emerald-700 dark:text-emerald-400">
              PR #{prNumber} opened
            </span>{" "}
            ·{" "}
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {prUrl}
            </a>
            {unverified.length > 0 ? (
              <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                ⚠️ {unverified.length} file
                {unverified.length === 1 ? "" : "s"} did not pass verification
                — review the diff carefully.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="flex items-start gap-2">
          <StatusIcon state="fail" />
          <span className="text-red-600">{errorMsg}</span>
        </div>
      ) : null}
    </div>
  );
}
