"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveSpecAction } from "@/app/_actions/spec";

export function ApproveSpecButton({ featureId }: { featureId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await approveSpecAction({ featureId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Spec approved");
    });
  };

  return (
    <Button type="button" disabled={isPending} onClick={handleClick}>
      {isPending ? "Approving…" : "Approve spec"}
    </Button>
  );
}
