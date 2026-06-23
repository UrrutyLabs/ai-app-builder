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
    <span className="inline-block animate-spin text-muted-foreground">◐</span>
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
  let consistencyIssueCount: number | null = null;
  let prUrl: string | null = null;
  let prNumber: number | null = null;
  let unverified: string[] = [];
  let consistencyIssues: Array<{ path: string; description: string }> = [];
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
      case "consistency-complete":
        consistencyIssueCount = e.issueCount;
        break;
      case "committing":
        committing = e.total;
        break;
      case "pr-opened":
        prUrl = e.url;
        prNumber = e.number;
        unverified = e.unverifiedFiles;
        consistencyIssues = e.consistencyIssues;
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
    <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
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
              <span className="text-xs text-muted-foreground">
                ({row.action})
              </span>
              {row.ms !== undefined ? (
                <span className="text-xs text-muted-foreground">
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

      {consistencyIssueCount !== null ? (
        <div className="flex items-center gap-2">
          <StatusIcon state="done" />
          <span>
            Consistency check{" "}
            {consistencyIssueCount === 0
              ? "— no issues found"
              : `— ${consistencyIssueCount} issue${consistencyIssueCount === 1 ? "" : "s"} flagged`}
          </span>
        </div>
      ) : null}

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
              className="underline transition-colors hover:text-foreground"
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
            {consistencyIssues.length > 0 ? (
              <div className="mt-1 space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
                <div>
                  🔎 {consistencyIssues.length} cross-file consistency
                  issue{consistencyIssues.length === 1 ? "" : "s"} flagged:
                </div>
                <ul className="ml-4 list-disc">
                  {consistencyIssues.map((issue, i) => (
                    <li key={i}>
                      <span className="font-mono">{issue.path}</span> —{" "}
                      {issue.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="flex items-start gap-2">
          <StatusIcon state="fail" />
          <span className="text-destructive">{errorMsg}</span>
        </div>
      ) : null}
    </div>
  );
}
