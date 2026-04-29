import { describe, expect, it } from "vitest";
import { EnvSchema } from "./env-schema";

describe("EnvSchema", () => {
  const validKey = "DXvV8ZMr9dAB9BEKejubwyzVxkbovGmNOPUgIdKn8PQ=";

  it("accepts a valid env with required vars", () => {
    const result = EnvSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DIRECT_URL: "postgres://user:pass@localhost:5432/db",
      ANTHROPIC_API_KEY: "sk-test-123",
      ENCRYPTION_KEY: validKey,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when DATABASE_URL is missing", () => {
    const result = EnvSchema.safeParse({
      DIRECT_URL: "postgres://user:pass@localhost:5432/db",
      ANTHROPIC_API_KEY: "sk-test-123",
      ENCRYPTION_KEY: validKey,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when ANTHROPIC_API_KEY is empty", () => {
    const result = EnvSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DIRECT_URL: "postgres://user:pass@localhost:5432/db",
      ANTHROPIC_API_KEY: "",
      ENCRYPTION_KEY: validKey,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when ENCRYPTION_KEY is malformed", () => {
    const result = EnvSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      DIRECT_URL: "postgres://user:pass@localhost:5432/db",
      ANTHROPIC_API_KEY: "sk-test-123",
      ENCRYPTION_KEY: "too-short",
    });
    expect(result.success).toBe(false);
  });
});
