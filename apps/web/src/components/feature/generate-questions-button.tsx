"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateQuestionsAction } from "@/app/_actions/questions";

export function GenerateQuestionsButton({
  featureId,
  hasQuestions,
}: {
  featureId: string;
  hasQuestions: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await generateQuestionsAction({ featureId });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  return (
    <Button type="button" disabled={isPending} onClick={handleClick}>
      {isPending
        ? "Generating…"
        : hasQuestions
          ? "Regenerate questions"
          : "Generate clarifying questions"}
    </Button>
  );
}
