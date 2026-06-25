import type { GroupedDecisions } from "@/lib/transcript-context";

export function TranscriptContextView({
  context,
}: {
  context: GroupedDecisions;
}) {
  const sections: Array<{ label: string; items: string[] }> = [
    { label: "Decisions", items: context.decisions },
    { label: "Constraints", items: context.constraints },
    { label: "Open questions", items: context.openQuestions },
  ];
  const nonEmpty = sections.filter((s) => s.items.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {nonEmpty.map((s) => (
        <div key={s.label} className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
            {s.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
