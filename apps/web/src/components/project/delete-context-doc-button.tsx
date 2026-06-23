"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteContextDocAction } from "@/app/_actions/context-docs";

export function DeleteContextDocButton({ docId }: { docId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await deleteContextDocAction({ docId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Document removed");
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {isPending ? "Removing…" : "Remove"}
    </Button>
  );
}
