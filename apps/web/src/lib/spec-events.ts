import type { FeatureSpec } from "@repo/domain/schemas";

/**
 * SSE event shape for the streaming spec route. Mirrors the pattern from
 * pr-events.ts. `snapshot` is the running partial-parsed object from the
 * Anthropic tool-use stream — fields fill in as the LLM generates them.
 */
export type SpecEvent =
  | { type: "snapshot"; snapshot: unknown }
  | { type: "complete"; spec: FeatureSpec }
  | { type: "error"; code: string; message: string };
