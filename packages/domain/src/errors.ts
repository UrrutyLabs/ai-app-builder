export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("VALIDATION", message, cause);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("NOT_FOUND", message, cause);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("CONFLICT", message, cause);
    this.name = "ConflictError";
  }
}

export class LlmError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("LLM", message, cause);
    this.name = "LlmError";
  }
}
