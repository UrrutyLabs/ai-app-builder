"use client";

import { useState, useTransition } from "react";
import { deleteContextDocAction } from "@/app/_actions/context-docs";

export function DeleteContextDocButton({ docId }: { docId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteContextDocAction({ docId });
      if (!result.ok) setError(result.error.message);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="text-xs text-neutral-500 underline hover:text-red-600 disabled:opacity-50 dark:text-neutral-400"
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
