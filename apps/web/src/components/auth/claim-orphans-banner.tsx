"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimUnclaimedProjectsAction } from "@/app/_actions/projects";

export function ClaimOrphansBanner({ count }: { count: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const onClaim = () => {
    setError(null);
    startTransition(async () => {
      const result = await claimUnclaimedProjectsAction();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDismissed(true);
      router.refresh();
    });
  };

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-amber-900 dark:text-amber-200">
            You have {count} unclaimed project{count === 1 ? "" : "s"}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300">
            These were created before auth was added. Claim them to make them
            yours.
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onClaim}
            disabled={isPending}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "Claiming…" : "Claim"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
