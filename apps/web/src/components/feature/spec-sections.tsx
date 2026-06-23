"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { FeatureSpec } from "@repo/domain/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSpecAction } from "@/app/_actions/spec";

const linesToArray = (s: string): string[] =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const arrayToLines = (a: string[]): string => a.join("\n");

interface Section {
  key: string;
  label: string;
  kind: "prose" | "list";
  group: "primary" | "more";
  get: (s: FeatureSpec) => string | string[];
  set: (s: FeatureSpec, v: string | string[]) => FeatureSpec;
}

const SECTIONS: Section[] = [
  { key: "problem", label: "Problem", kind: "prose", group: "primary", get: (s) => s.problem, set: (s, v) => ({ ...s, problem: v as string }) },
  { key: "goal", label: "Goal", kind: "prose", group: "primary", get: (s) => s.goal, set: (s, v) => ({ ...s, goal: v as string }) },
  { key: "scopeIn", label: "In scope", kind: "list", group: "primary", get: (s) => s.scope.in, set: (s, v) => ({ ...s, scope: { ...s.scope, in: v as string[] } }) },
  { key: "scopeOut", label: "Out of scope", kind: "list", group: "primary", get: (s) => s.scope.out, set: (s, v) => ({ ...s, scope: { ...s.scope, out: v as string[] } }) },
  { key: "acceptanceCriteria", label: "Acceptance criteria", kind: "list", group: "primary", get: (s) => s.acceptanceCriteria, set: (s, v) => ({ ...s, acceptanceCriteria: v as string[] }) },
  { key: "actors", label: "Actors", kind: "list", group: "more", get: (s) => s.actors, set: (s, v) => ({ ...s, actors: v as string[] }) },
  { key: "userFlows", label: "User flows", kind: "list", group: "more", get: (s) => s.userFlows, set: (s, v) => ({ ...s, userFlows: v as string[] }) },
  { key: "uiStates", label: "UI states", kind: "list", group: "more", get: (s) => s.uiStates, set: (s, v) => ({ ...s, uiStates: v as string[] }) },
  { key: "businessRules", label: "Business rules", kind: "list", group: "more", get: (s) => s.businessRules, set: (s, v) => ({ ...s, businessRules: v as string[] }) },
  { key: "dataChanges", label: "Data changes", kind: "list", group: "more", get: (s) => s.dataChanges, set: (s, v) => ({ ...s, dataChanges: v as string[] }) },
  { key: "apiChanges", label: "API changes", kind: "list", group: "more", get: (s) => s.apiChanges, set: (s, v) => ({ ...s, apiChanges: v as string[] }) },
  { key: "assumptions", label: "Assumptions", kind: "list", group: "more", get: (s) => s.assumptions, set: (s, v) => ({ ...s, assumptions: v as string[] }) },
  { key: "openQuestions", label: "Open questions", kind: "list", group: "more", get: (s) => s.openQuestions, set: (s, v) => ({ ...s, openQuestions: v as string[] }) },
];

export function SpecSections({
  featureId,
  spec: initialSpec,
}: {
  featureId: string;
  spec: FeatureSpec;
}) {
  const router = useRouter();
  const [spec, setSpec] = useState(initialSpec);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const startEdit = (key: string, value: string) => {
    setDraft(value);
    setEditingKey(key);
  };
  const cancel = () => {
    setEditingKey(null);
    setDraft("");
  };

  const persist = async (
    updated: FeatureSpec,
    note: string,
  ): Promise<boolean> => {
    setSaving(true);
    const result = await saveSpecAction({ featureId, spec: updated, note });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    setSpec(updated);
    setEditingKey(null);
    toast.success(`${note}`);
    router.refresh();
    return true;
  };

  const saveSection = (sec: Section) => {
    const value =
      sec.kind === "list" ? linesToArray(draft) : draft.trim();
    void persist(sec.set(spec, value), `Edited ${sec.label}`);
  };

  const card = (sec: Section) => {
    const editing = editingKey === sec.key;
    const val = sec.get(spec);
    return (
      <div
        key={sec.key}
        className={cn(
          "rounded-lg border bg-card p-4",
          editing && "border-primary/40",
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {sec.label}
          </span>
          <span className="flex-1" />
          {!editing ? (
            <button
              type="button"
              onClick={() =>
                startEdit(
                  sec.key,
                  sec.kind === "list"
                    ? arrayToLines(val as string[])
                    : (val as string),
                )
              }
              aria-label={`Edit ${sec.label}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={sec.kind === "prose" ? 4 : 6}
              placeholder={sec.kind === "list" ? "One item per line" : undefined}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={saving} onClick={() => saveSection(sec)}>
                {saving ? "Saving…" : "Save section"}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : sec.kind === "prose" ? (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {val as string}
          </p>
        ) : (val as string[]).length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
            {(val as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </div>
    );
  };

  const titleEditing = editingKey === "title";
  const more = SECTIONS.filter((s) => s.group === "more");

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        {titleEditing ? (
          <div className="space-y-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  void persist({ ...spec, title: draft.trim() }, "Edited Title")
                }
              >
                {saving ? "Saving…" : "Save section"}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">{spec.title}</h2>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => startEdit("title", spec.title)}
              aria-label="Edit title"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {SECTIONS.filter((s) => s.group === "primary").map(card)}

      <button
        type="button"
        onClick={() => setShowMore((m) => !m)}
        className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
      >
        {showMore ? "Hide" : "Show"} {more.length} more sections
      </button>
      {showMore ? more.map(card) : null}
    </div>
  );
}
