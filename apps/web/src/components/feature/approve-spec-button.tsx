"use client";

import { useState, useTransition } from "react";
import { approveSpecAction } from "@/app/_actions/spec";

export function ApproveSpecButton({ featureId }: { featureId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveSpecAction({ featureId });
      if (!result.ok) setError(result.error.message);
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Approving…" : "Approve spec"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
