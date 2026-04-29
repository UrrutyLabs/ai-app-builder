"use client";

import { useState, useTransition } from "react";
import { exportFeatureAction } from "@/app/_actions/export";

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ featureId }: { featureId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExport = (format: "json" | "markdown") => {
    setError(null);
    startTransition(async () => {
      const result = await exportFeatureAction({ featureId, format });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      triggerDownload(
        result.data.filename,
        result.data.content,
        result.data.mimeType,
      );
    });
  };

  const cls =
    "rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleExport("markdown")}
          className={cls}
        >
          Download Markdown
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleExport("json")}
          className={cls}
        >
          Download JSON
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
