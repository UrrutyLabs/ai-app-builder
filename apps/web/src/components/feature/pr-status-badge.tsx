import type { PrStatus } from "@/lib/pr-status";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function PrStatusBadge({ status }: { status: PrStatus | null }) {
  if (!status) {
    return (
      <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
        status unknown
      </span>
    );
  }
  if (status.state === "merged") {
    return (
      <span className="rounded-full border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs uppercase tracking-wide text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
        ✓ Merged{status.mergedAt ? ` ${formatRelative(status.mergedAt)}` : ""}
      </span>
    );
  }
  if (status.state === "closed") {
    return (
      <span className="rounded-full border bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
        ✗ Closed
        {status.closedAt ? ` ${formatRelative(status.closedAt)}` : ""}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      Open
    </span>
  );
}
