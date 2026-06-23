import type { ProjectContextDocRecord } from "@repo/db";
import { AddContextDocForm } from "./add-context-doc-form";
import { DeleteContextDocButton } from "./delete-context-doc-button";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContextDocsSection({
  projectId,
  docs,
}: {
  projectId: string;
  docs: ProjectContextDocRecord[];
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Context documents</div>
      <p className="text-xs text-muted-foreground">
        PRDs, domain models, or notes — indexed and fed into every feature.
      </p>

      {docs.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {d.mimeType === "text/markdown" ? "Markdown" : "Text"} ·{" "}
                  {formatBytes(d.byteLength)} ·{" "}
                  {d.createdAt.toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </div>
              </div>
              <DeleteContextDocButton docId={d.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No documents attached yet.
        </p>
      )}

      <AddContextDocForm projectId={projectId} />
    </div>
  );
}
