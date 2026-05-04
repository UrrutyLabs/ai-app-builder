import type { DiffLine } from "@/lib/spec-diff";

export function SpecDiffView({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500 dark:text-neutral-400">
        No changes from the previous version.
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-md border border-neutral-200 bg-white p-3 font-mono text-xs leading-relaxed dark:border-neutral-800 dark:bg-neutral-950">
      {lines.map((line, i) => {
        if (line.type === "header") {
          return (
            <div
              key={i}
              className="border-y border-neutral-200 bg-neutral-100 px-2 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
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
            className="px-2 text-neutral-700 dark:text-neutral-300"
          >
            <span className="select-none text-neutral-400"> </span>
            {line.text || " "}
          </div>
        );
      })}
    </pre>
  );
}
