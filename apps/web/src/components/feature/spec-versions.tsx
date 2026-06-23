"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { restoreSpecVersionAction } from "@/app/_actions/spec";

export interface VersionItem {
  id: string;
  label: string;
  note: string | null;
  when: string;
  isCurrent: boolean;
}

export function SpecVersions({
  featureId,
  versions,
  historyHref,
}: {
  featureId: string;
  versions: VersionItem[];
  historyHref: string;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<VersionItem | null>(null);
  const [restoring, setRestoring] = useState(false);

  const confirmRestore = async () => {
    if (!target) return;
    setRestoring(true);
    const result = await restoreSpecVersionAction({
      featureId,
      versionId: target.id,
    });
    setRestoring(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Restored ${target.label}`);
    setTarget(null);
    router.refresh();
  };

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Versions
      </div>
      <ul className="mt-2 space-y-2 text-sm">
        {versions.map((v) => (
          <li key={v.id}>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{v.label}</span>
              <span className="text-xs text-muted-foreground">{v.when}</span>
              <span className="flex-1" />
              {v.isCurrent ? (
                <span className="text-xs text-muted-foreground">current</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTarget(v)}
                  className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  Restore
                </button>
              )}
            </div>
            {v.note ? (
              <div className="truncate text-xs text-muted-foreground">
                {v.note}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <Link
        href={historyHref}
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <History className="size-3.5" aria-hidden="true" />
        View full history
      </Link>

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore {target?.label}?</DialogTitle>
            <DialogDescription>
              This creates a new version with {target?.label}&apos;s content —
              the current version stays in history, so nothing is lost. The spec
              will need re-approval, and any generated plan will be marked stale
              until you regenerate it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button disabled={restoring} onClick={confirmRestore}>
              {restoring ? "Restoring…" : `Restore ${target?.label ?? ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
