"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A pipeline-map row whose content expands inline. Used for the light stages
 * (Idea, Q&A) that don't warrant their own route. Heavy stages link out to a
 * workspace instead.
 */
export function CollapsibleStage({
  label,
  summary,
  icon,
  defaultOpen = false,
  children,
}: {
  label: string;
  summary: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="shrink-0">{icon}</span>
        <span className="w-12 shrink-0 text-sm font-medium">{label}</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {summary}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}
