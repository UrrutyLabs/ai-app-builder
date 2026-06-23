"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimUnclaimedProjectsAction } from "@/app/_actions/projects";

export function ClaimOrphansBanner({ count }: { count: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const onClaim = () => {
    startTransition(async () => {
      const result = await claimUnclaimedProjectsAction();
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setDismissed(true);
      toast.success(
        `Claimed ${count} project${count === 1 ? "" : "s"}`,
      );
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClaim}
            disabled={isPending}
          >
            {isPending ? "Claiming…" : "Claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
