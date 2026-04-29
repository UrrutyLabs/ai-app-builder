import { AppError, LlmError } from "@repo/domain";

export function toActionError(err: unknown): { code: string; message: string } {
  if (err instanceof LlmError) {
    console.error(`[LlmError] ${err.message}`, err.cause ?? "");
    const causeMessage =
      err.cause instanceof Error
        ? err.cause.message
        : err.cause
          ? String(err.cause)
          : "";
    return {
      code: err.code,
      message: causeMessage ? `${err.message} — ${causeMessage}` : err.message,
    };
  }
  if (err instanceof AppError) {
    console.error(`[${err.code}] ${err.message}`, err.cause ?? "");
    return { code: err.code, message: err.message };
  }
  console.error("Unhandled server action error:", err);
  return { code: "INTERNAL", message: "Something went wrong" };
}
