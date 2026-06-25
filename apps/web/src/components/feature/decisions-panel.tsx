"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addDecisionAction,
  setDecisionStatusAction,
} from "@/app/_actions/decisions";

export type DecisionLite = {
  id: string;
  kind: "DECISION" | "CONSTRAINT" | "OPEN_QUESTION";
  status: "OPEN" | "ACCEPTED" | "SUPERSEDED" | "REJECTED";
  statement: string;
};

const KIND_LABEL: Record<DecisionLite["kind"], string> = {
  DECISION: "Decisions",
  CONSTRAINT: "Constraints",
  OPEN_QUESTION: "Open questions",
};
const KIND_ORDER: DecisionLite["kind"][] = [
  "DECISION",
  "CONSTRAINT",
  "OPEN_QUESTION",
];

export function DecisionsPanel({
  featureId,
  decisions,
}: {
  featureId: string;
  decisions: DecisionLite[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<DecisionLite["kind"]>("DECISION");
  const [statement, setStatement] = useState("");

  const setStatus = (decisionId: string, status: DecisionLite["status"]) => {
    startTransition(async () => {
      const r = await setDecisionStatusAction({ decisionId, status });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      router.refresh();
    });
  };

  const add = () => {
    const text = statement.trim();
    if (!text) return;
    startTransition(async () => {
      const r = await addDecisionAction({ featureId, kind, statement: text });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      setStatement("");
      toast.success("Decision added");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {KIND_ORDER.map((k) => {
        const items = decisions.filter((d) => d.kind === k);
        if (!items.length) return null;
        return (
          <div key={k} className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {KIND_LABEL[k]}
            </div>
            <ul className="space-y-1.5">
              {items.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span
                    className={cn(
                      "flex-1 text-foreground/80",
                      d.status === "REJECTED" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {d.statement}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <StatusButton
                      active={d.status === "ACCEPTED"}
                      onClick={() => setStatus(d.id, "ACCEPTED")}
                      disabled={isPending}
                      label="Accept"
                      tone="accept"
                      icon={<Check className="size-3.5" aria-hidden="true" />}
                    />
                    <StatusButton
                      active={d.status === "REJECTED"}
                      onClick={() => setStatus(d.id, "REJECTED")}
                      disabled={isPending}
                      label="Reject"
                      tone="reject"
                      icon={<X className="size-3.5" aria-hidden="true" />}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No decisions yet. Add the first one — these ground every downstream
          step.
        </p>
      ) : null}

      <div className="flex items-center gap-2 border-t pt-3">
        <select
          value={kind}
          // The value is constrained to the option set below, so narrowing the
          // string to the kind union is safe.
          onChange={(e) => setKind(e.target.value as DecisionLite["kind"])}
          className="h-9 shrink-0 rounded-md border bg-background px-2 text-sm"
          aria-label="Decision kind"
        >
          <option value="DECISION">Decision</option>
          <option value="CONSTRAINT">Constraint</option>
          <option value="OPEN_QUESTION">Open question</option>
        </select>
        <Input
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a decision, constraint, or question…"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={isPending || !statement.trim()}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  disabled,
  label,
  tone,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  tone: "accept" | "reject";
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || active}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-md border transition-colors disabled:cursor-default",
        active
          ? tone === "reject"
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
    </button>
  );
}
