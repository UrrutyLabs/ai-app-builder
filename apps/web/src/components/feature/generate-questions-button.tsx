"use client";

import { useState, useTransition } from "react";
import { generateQuestionsAction } from "@/app/_actions/questions";

export function GenerateQuestionsButton({
  featureId,
  hasQuestions,
}: {
  featureId: string;
  hasQuestions: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateQuestionsAction({ featureId });
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
          ? "Generating…"
          : hasQuestions
            ? "Regenerate questions"
            : "Generate clarifying questions"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
