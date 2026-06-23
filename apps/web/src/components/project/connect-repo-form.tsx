"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ConnectRepoInputSchema,
  type ConnectRepoInput,
} from "@repo/domain/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectRepoAction } from "@/app/_actions/repo";

export function ConnectRepoForm({ projectId }: { projectId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnectRepoInput>({
    resolver: zodResolver(ConnectRepoInputSchema),
    defaultValues: { projectId, repoUrl: "", pat: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await connectRepoAction(values);
    if (result && !result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Repo connected and indexed");
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-dashed p-4"
    >
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <Label htmlFor="repoUrl">GitHub repo URL</Label>
        <Input
          id="repoUrl"
          {...register("repoUrl")}
          placeholder="https://github.com/owner/repo"
        />
        {errors.repoUrl ? (
          <p className="text-sm text-destructive">{errors.repoUrl.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pat">Personal access token</Label>
        <Input
          id="pat"
          type="password"
          {...register("pat")}
          placeholder="ghp_..."
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Create a PAT with <code>repo</code> scope (or <code>public_repo</code>{" "}
          for public repos). Stored encrypted at rest.
        </p>
        {errors.pat ? (
          <p className="text-sm text-destructive">{errors.pat.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connecting…" : "Connect repo"}
        </Button>
      </div>
    </form>
  );
}
