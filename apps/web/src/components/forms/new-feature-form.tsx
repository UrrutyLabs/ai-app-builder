"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CreateFeatureInputSchema,
  ExtractFromTranscriptInputSchema,
  type CreateFeatureInput,
  type ExtractFromTranscriptInput,
} from "@repo/domain/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFeatureAction } from "@/app/_actions/features";
import { extractFromTranscriptAction } from "@/app/_actions/transcript";

type Mode = "idea" | "transcript";

export function NewFeatureForm({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("idea");

  const tabClass = (active: boolean) =>
    cn(
      "rounded px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("idea")}
          className={tabClass(mode === "idea")}
        >
          Type an idea
        </button>
        <button
          type="button"
          onClick={() => setMode("transcript")}
          className={tabClass(mode === "transcript")}
        >
          Paste a transcript
        </button>
      </div>

      {mode === "idea" ? (
        <IdeaForm projectId={projectId} />
      ) : (
        <TranscriptForm projectId={projectId} />
      )}
    </div>
  );
}

function IdeaForm({ projectId }: { projectId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFeatureInput>({
    resolver: zodResolver(CreateFeatureInputSchema),
    defaultValues: { projectId, title: "", idea: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await createFeatureAction(values);
    if (result && !result.ok) toast.error(result.error.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Pickup notes on orders"
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="idea">Idea</Label>
        <Textarea
          id="idea"
          {...register("idea")}
          rows={6}
          placeholder="I want to add pickup notes to orders so drivers can see customer instructions…"
        />
        {errors.idea ? (
          <p className="text-sm text-destructive">{errors.idea.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create feature"}
        </Button>
      </div>
    </form>
  );
}

function TranscriptForm({ projectId }: { projectId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExtractFromTranscriptInput>({
    resolver: zodResolver(ExtractFromTranscriptInputSchema),
    defaultValues: { projectId, transcript: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await extractFromTranscriptAction(values);
    if (result && !result.ok) toast.error(result.error.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" {...register("projectId")} />

      <div className="space-y-2">
        <Label htmlFor="transcript">Refinement transcript</Label>
        <p className="text-xs text-muted-foreground">
          Paste a meeting transcript. The system will distill it into a feature
          title, idea, and supporting context — you&apos;ll review everything
          before the pipeline runs.
        </p>
        <Textarea
          id="transcript"
          {...register("transcript")}
          rows={16}
          className="font-mono text-xs leading-relaxed"
          placeholder={`Alice: I think we need pickup notes on orders so drivers know about customer requests…
Bob: Yeah, but only visible to drivers, not customers.
Alice: And it shouldn't require a migration if possible.
Bob: One question — should drivers be able to edit them after pickup?`}
        />
        {errors.transcript ? (
          <p className="text-sm text-destructive">
            {errors.transcript.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Extracting…" : "Extract feature from transcript"}
        </Button>
      </div>
    </form>
  );
}
