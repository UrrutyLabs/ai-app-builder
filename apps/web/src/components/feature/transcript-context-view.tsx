import type { TranscriptContext } from "@repo/domain/schemas";

export function TranscriptContextView({
  context,
}: {
  context: TranscriptContext;
}) {
  const sections: Array<{ label: string; items: string[] }> = [
    { label: "Decisions", items: context.decisions },
    { label: "Constraints", items: context.constraints },
    { label: "Open questions", items: context.openQuestions },
  ];
  const nonEmpty = sections.filter((s) => s.items.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      {nonEmpty.map((s) => (
        <div key={s.label} className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {s.label}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {s.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
