"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SpecEvent } from "@/lib/spec-events";

export function GenerateSpecButton({
  featureId,
  hasSpec,
}: {
  featureId: string;
  hasSpec: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const previewRef = useRef<HTMLPreElement | null>(null);

  const startStream = async () => {
    setError(null);
    setSnapshot(null);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/spec/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by "\n\n".
        let frameEnd: number;
        while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, frameEnd);
          buffer = buffer.slice(frameEnd + 2);
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as SpecEvent;
          if (event.type === "snapshot") {
            setSnapshot(event.snapshot);
            // Auto-scroll preview to bottom as it grows.
            requestAnimationFrame(() => {
              if (previewRef.current) {
                previewRef.current.scrollTop = previewRef.current.scrollHeight;
              }
            });
          } else if (event.type === "complete") {
            setSnapshot(null);
            setIsStreaming(false);
            router.refresh();
            return;
          } else {
            throw new Error(event.message);
          }
        }
      }
      // Stream ended without complete event.
      throw new Error("Stream ended unexpectedly");
    } catch (err) {
      setIsStreaming(false);
      setSnapshot(null);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isStreaming}
        onClick={startStream}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {isStreaming
          ? "Generating spec…"
          : hasSpec
            ? "Regenerate spec"
            : "Generate feature spec"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isStreaming && snapshot !== null ? (
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Live preview
          </div>
          <pre
            ref={previewRef}
            className="max-h-80 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
