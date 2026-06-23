"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PrEvent } from "@/lib/pr-events";
import { PrProgress } from "./pr-progress";

const DEFAULT_SPEC_PATH = "docs/specs";
const DEFAULT_PLAN_PATH = "docs/plans";

type FileMode = "none" | "stubs" | "generate";

export function CreatePrForm({
  featureId,
  defaultSpecPath,
  defaultPlanPath,
  hasExistingPr,
  scaffoldableCount,
  generatableCreate,
  generatableModify,
}: {
  featureId: string;
  defaultSpecPath: string | null;
  defaultPlanPath: string | null;
  hasExistingPr: boolean;
  scaffoldableCount: number;
  generatableCreate: number;
  generatableModify: number;
}) {
  const router = useRouter();
  const generatableTotal = generatableCreate + generatableModify;
  const [specPath, setSpecPath] = useState(
    defaultSpecPath ?? DEFAULT_SPEC_PATH,
  );
  const [planPath, setPlanPath] = useState(
    defaultPlanPath ?? DEFAULT_PLAN_PATH,
  );
  const [fileMode, setFileMode] = useState<FileMode>(
    scaffoldableCount > 0 ? "stubs" : "none",
  );
  const [events, setEvents] = useState<PrEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEvents([]);
    setIsStreaming(true);

    let prOpened = false;
    try {
      const res = await fetch("/api/pr/create", {
        method: "POST",
        body: JSON.stringify({ featureId, specPath, planPath, fileMode }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(trimmed.slice(6)) as PrEvent;
            setEvents((prev) => [...prev, event]);
            if (event.type === "pr-opened") prOpened = true;
          } catch {
            // skip malformed event
          }
        }
      }
    } catch (err) {
      setEvents((prev) => [
        ...prev,
        {
          type: "error",
          code: "NETWORK",
          message: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setIsStreaming(false);
      if (prOpened) {
        // Small delay so the success state is visible before refresh.
        setTimeout(() => router.refresh(), 800);
      }
    }
  };

  const submittingLabel =
    fileMode === "generate" ? "Generating code & opening PR…" : "Opening PR…";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="specPath">Spec directory</Label>
          <Input
            id="specPath"
            value={specPath}
            onChange={(e) => setSpecPath(e.target.value)}
            placeholder={DEFAULT_SPEC_PATH}
            className="font-mono"
            disabled={isStreaming}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="planPath">Plan directory</Label>
          <Input
            id="planPath"
            value={planPath}
            onChange={(e) => setPlanPath(e.target.value)}
            placeholder={DEFAULT_PLAN_PATH}
            className="font-mono"
            disabled={isStreaming}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Spec and plan land at <code>{specPath}/&lt;slug&gt;.md</code> and{" "}
        <code>{planPath}/&lt;slug&gt;.md</code> on a new branch.
      </p>

      {generatableTotal > 0 ? (
        <fieldset
          disabled={isStreaming}
          className="space-y-2 rounded-md border bg-muted/50 p-3 disabled:opacity-60"
        >
          <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Plan touches {generatableTotal} file
            {generatableTotal === 1 ? "" : "s"}
            {generatableModify > 0
              ? ` (${generatableCreate} new, ${generatableModify} to modify)`
              : ""}
          </legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="fileMode"
              value="none"
              checked={fileMode === "none"}
              onChange={() => setFileMode("none")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Skip code files</span>
              <span className="block text-xs text-muted-foreground">
                Only commit the spec and plan markdown files.
              </span>
            </span>
          </label>
          {scaffoldableCount > 0 ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="fileMode"
                value="stubs"
                checked={fileMode === "stubs"}
                onChange={() => setFileMode("stubs")}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">
                  Scaffold {scaffoldableCount} empty stub
                  {scaffoldableCount === 1 ? "" : "s"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Each new file gets a TODO header in the right comment syntax.
                  Fast, free. Modify actions are skipped in this mode.
                </span>
              </span>
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="fileMode"
              value="generate"
              checked={fileMode === "generate"}
              onChange={() => setFileMode("generate")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">
                Generate {generatableTotal} file
                {generatableTotal === 1 ? "" : "s"}
              </span>{" "}
              <span className="text-muted-foreground">
                (~${(0.04 * generatableTotal).toFixed(2)}–$
                {(0.1 * generatableTotal).toFixed(2)},{" "}
                {Math.round(generatableTotal * 5)}–
                {Math.round(generatableTotal * 12)}s)
              </span>
              <span className="block text-xs text-muted-foreground">
                AI writes new files and rewrites existing ones using the spec,
                your repo&apos;s conventions, and retrieved code context. Each
                file is parse- and type-checked with one repair attempt on
                failure.
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isStreaming}>
          {isStreaming
            ? submittingLabel
            : hasExistingPr
              ? "Open another PR"
              : "Open PR with spec & plan"}
        </Button>
      </div>

      <PrProgress events={events} isStreaming={isStreaming} />
    </form>
  );
}
