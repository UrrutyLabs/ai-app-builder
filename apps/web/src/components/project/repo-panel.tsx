"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { RepoRecord } from "@repo/db";
import { shortStackLabel } from "@repo/repos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  embeddingCount,
}: {
  projectId: string;
  repo: RepoRecord | null;
  embeddingCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshRepoAction({ projectId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Repo refreshed");
    });
  };

  const handleDisconnect = () => {
    if (
      !confirm(
        "Disconnect repo? Future generations won't include code context. Existing specs and plans are unchanged.",
      )
    )
      return;
    startTransition(async () => {
      const result = await disconnectRepoAction({ projectId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Repo disconnected");
    });
  };

  if (!repo) {
    return <ConnectRepoForm projectId={projectId} />;
  }

  const fileCount =
    repo.fileTree?.entries.filter((e) => e.type === "file").length ?? 0;
  const truncated = repo.fileTree?.truncated ?? false;
  const stackLabel = repo.conventions ? shortStackLabel(repo.conventions) : "";

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {repo.owner}/{repo.repo}
            </span>
            <Badge variant="outline">{repo.defaultBranch}</Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {fileCount} file{fileCount === 1 ? "" : "s"} in tree
            {truncated ? " (truncated at 5000)" : ""}
            {embeddingCount > 0
              ? ` · ${embeddingCount} embedded for retrieval`
              : ""}
            {repo.lastIndexedAt
              ? ` · last refreshed ${formatRelative(repo.lastIndexedAt)}`
              : ""}
          </div>
          {stackLabel ? (
            <div className="mt-1 text-xs text-foreground/80">
              <span className="text-muted-foreground">Detected:</span>{" "}
              {stackLabel}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
          >
            {isPending ? "Working…" : "Refresh"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isPending}
          >
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
