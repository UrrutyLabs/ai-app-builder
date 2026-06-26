import { Fragment } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageInfo, StageKey } from "@/lib/feature-stages";

function StepCircle({
  state,
  current,
}: {
  state: StageInfo["state"];
  current: boolean;
}) {
  const ring = current ? "ring-2 ring-primary/40" : "";
  if (state === "done") {
    return (
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
          ring,
        )}
      >
        <Check className="size-3" aria-hidden="true" />
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border text-muted-foreground",
          ring,
        )}
      >
        <Lock className="size-2.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded-full border-[1.5px] border-foreground",
        ring,
      )}
    >
      <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
    </span>
  );
}

/**
 * Progress stepper across a feature's stage pages. States (done / active /
 * locked) come from {@link deriveStageStates}; the current page is emphasised.
 * Every stage stays clickable — each page renders its own locked/empty state.
 */
export function StageStepper({
  hubHref,
  stages,
  activeKey,
  showPr,
}: {
  hubHref: string;
  stages: StageInfo[];
  activeKey: StageKey;
  showPr: boolean;
}) {
  const visible = showPr ? stages : stages.filter((s) => s.key !== "pr");
  return (
    <nav
      aria-label="Feature stages"
      className="mb-5 flex max-w-3xl items-center gap-2 text-sm"
    >
      {visible.map((s, i) => {
        const current = s.key === activeKey;
        return (
          <Fragment key={s.key}>
            {i > 0 ? (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            ) : null}
            <Link
              href={`${hubHref}/${s.key}`}
              aria-current={current ? "page" : undefined}
              className="flex items-center gap-1.5"
            >
              <StepCircle state={s.state} current={current} />
              <span
                className={cn(
                  "transition-colors",
                  current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </span>
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
