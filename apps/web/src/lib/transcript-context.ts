import {
  TranscriptContextSchema,
  type TranscriptContext,
} from "@repo/domain/schemas";

/** Parse a Feature.transcriptContext JSON column into a typed shape. */
export function parseTranscriptContext(
  raw: unknown,
): TranscriptContext | null {
  if (!raw) return null;
  const parsed = TranscriptContextSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Render TranscriptContext as a prompt block for question / spec generation. */
export function renderTranscriptContext(
  ctx: TranscriptContext | null,
): string | null {
  if (!ctx) return null;
  const sections: string[] = [];
  if (ctx.decisions.length) {
    sections.push(
      `Decisions settled in the refinement transcript:\n${ctx.decisions
        .map((d) => `- ${d}`)
        .join("\n")}`,
    );
  }
  if (ctx.constraints.length) {
    sections.push(
      `Constraints surfaced in the transcript:\n${ctx.constraints
        .map((c) => `- ${c}`)
        .join("\n")}`,
    );
  }
  if (ctx.openQuestions.length) {
    sections.push(
      `Open questions left unresolved in the transcript:\n${ctx.openQuestions
        .map((q) => `- ${q}`)
        .join("\n")}`,
    );
  }
  if (!sections.length) return null;
  return sections.join("\n\n");
}
