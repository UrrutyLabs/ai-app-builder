"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CreateProjectInputSchema,
  type CreateProjectInput,
} from "@repo/domain/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/app/_actions/projects";

export function NewProjectForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectInputSchema),
    defaultValues: { name: "", mode: "greenfield", description: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await createProjectAction({
      ...values,
      description: values.description || null,
    });
    if (result && !result.ok) toast.error(result.error.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="My new project" />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Mode</legend>
        <div className="space-y-2">
          <label className="flex items-start gap-3">
            <input
              type="radio"
              value="greenfield"
              {...register("mode")}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Greenfield</span>
              <span className="block text-muted-foreground">
                New project, no existing code constraints.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="radio"
              value="existing_system"
              {...register("mode")}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Existing system</span>
              <span className="block text-muted-foreground">
                Feature on top of an existing codebase.
              </span>
            </span>
          </label>
        </div>
        {errors.mode ? (
          <p className="text-sm text-destructive">{errors.mode.message}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={3}
          placeholder="What is this project about?"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
