import type { DiffLine } from "@/lib/spec-diff";

export function SpecDiffView({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No changes from the previous version.
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-md border bg-card p-3 font-mono text-xs leading-relaxed">
      {lines.map((line, i) => {
        if (line.type === "header") {
          return (
            <div
              key={i}
              className="border-y border-border bg-muted px-2 text-muted-foreground"
            >
              {line.text}
            </div>
          );
        }
        if (line.type === "add") {
          return (
            <div
              key={i}
              className="bg-emerald-50 px-2 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <span className="select-none text-emerald-600 dark:text-emerald-400">
                +{" "}
              </span>
              {line.text || " "}
            </div>
          );
        }
        if (line.type === "remove") {
          return (
            <div
              key={i}
              className="bg-red-50 px-2 text-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              <span className="select-none text-red-600 dark:text-red-400">
                −{" "}
              </span>
              {line.text || " "}
            </div>
          );
        }
        return (
          <div
            key={i}
            className="px-2 text-foreground/80"
          >
            <span className="select-none text-muted-foreground"> </span>
            {line.text || " "}
          </div>
        );
      })}
    </pre>
  );
}
