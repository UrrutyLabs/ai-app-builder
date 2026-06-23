"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  UpdateProjectInputSchema,
  type UpdateProjectInput,
} from "@repo/domain/schemas";
import type { ProjectRecord } from "@repo/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProjectAction } from "@/app/_actions/projects";

export function EditProjectForm({ project }: { project: ProjectRecord }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectInputSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await updateProjectAction({
      ...values,
      description: values.description || null,
    });
    if (result && !result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Project updated");
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" {...register("id")} />

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href={`/projects/${project.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
