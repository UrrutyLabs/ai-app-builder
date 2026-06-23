"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, ChevronRight, Circle, Dot, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageState = "done" | "active" | "todo" | "locked";

export interface Stage {
  id: string;
  label: string;
  state: StageState;
}

const ICONS: Record<StageState, typeof Check> = {
  done: Check,
  active: Dot,
  todo: Circle,
  locked: Lock,
};

/**
 * Sticky pipeline stepper. Each stage links to its section anchor; an
 * IntersectionObserver scroll-spies the section currently in view and
 * highlights its chip. Locked stages render as non-interactive.
 */
export function FeatureStepper({ stages }: { stages: Stage[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    stages[0]?.id ?? null,
  );

  useEffect(() => {
    const els = stages
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stages]);

  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-background/85 py-2 backdrop-blur">
      {stages.map((s, i) => {
        const Icon = ICONS[s.state];
        const inView = activeId === s.id;
        const locked = s.state === "locked";
        const chip = (
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              inView && !locked && "bg-accent text-accent-foreground",
              !inView && s.state === "done" && "text-foreground",
              !inView && s.state === "active" && "text-primary",
              (s.state === "todo" || locked) && "text-muted-foreground",
              locked && "cursor-not-allowed",
              !locked && !inView && "hover:bg-accent/60",
            )}
          >
            <Icon
              className={cn(
                "size-3.5",
                s.state === "done" && "text-emerald-600 dark:text-emerald-400",
              )}
              aria-hidden="true"
            />
            {s.label}
          </span>
        );
        return (
          <Fragment key={s.id}>
            {locked ? (
              chip
            ) : (
              <a href={`#${s.id}`} aria-current={inView ? "true" : undefined}>
                {chip}
              </a>
            )}
            {i < stages.length - 1 ? (
              <ChevronRight
                className="size-3.5 text-muted-foreground/50"
                aria-hidden="true"
              />
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
