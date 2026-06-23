"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generatePlanAction } from "@/app/_actions/plan";

export function GeneratePlanButton({
  featureId,
  hasPlan,
}: {
  featureId: string;
  hasPlan: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await generatePlanAction({ featureId });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  return (
    <Button type="button" disabled={isPending} onClick={handleClick}>
      {isPending
        ? "Generating plan…"
        : hasPlan
          ? "Regenerate plan"
          : "Generate implementation plan"}
    </Button>
  );
}
