"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isPending, startTransition] = useTransition();

  const handleExport = (format: "json" | "markdown") => {
    startTransition(async () => {
      const result = await exportFeatureAction({ featureId, format });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      triggerDownload(
        result.data.filename,
        result.data.content,
        result.data.mimeType,
      );
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => handleExport("markdown")}
      >
        <Download className="size-4" aria-hidden="true" />
        Download Markdown
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => handleExport("json")}
      >
        <Download className="size-4" aria-hidden="true" />
        Download JSON
      </Button>
    </div>
  );
}
