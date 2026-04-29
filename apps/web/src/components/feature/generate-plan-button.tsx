"use client";

import { useState, useTransition } from "react";
import { generatePlanAction } from "@/app/_actions/plan";

export function GeneratePlanButton({
  featureId,
  hasPlan,
}: {
  featureId: string;
  hasPlan: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await generatePlanAction({ featureId });
      if (!result.ok) setError(result.error.message);
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {isPending
          ? "Generating plan…"
          : hasPlan
            ? "Regenerate plan"
            : "Generate implementation plan"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
