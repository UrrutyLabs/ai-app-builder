import { describe, expect, it } from "vitest";
import { EnvSchema } from "./env-schema";

describe("EnvSchema", () => {
  const validKey = "DXvV8ZMr9dAB9BEKejubwyzVxkbovGmNOPUgIdKn8PQ=";
  const baseValid = {
    DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    DIRECT_URL: "postgres://user:pass@localhost:5432/db",
    ANTHROPIC_API_KEY: "sk-ant-test",
    OPENAI_API_KEY: "sk-test",
    ENCRYPTION_KEY: validKey,
  };

  it("accepts a valid env with required vars", () => {
    expect(EnvSchema.safeParse(baseValid).success).toBe(true);
  });

  it("rejects when DATABASE_URL is missing", () => {
    const { DATABASE_URL: _, ...rest } = baseValid;
    void _;
    expect(EnvSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when ANTHROPIC_API_KEY is empty", () => {
    expect(
      EnvSchema.safeParse({ ...baseValid, ANTHROPIC_API_KEY: "" }).success,
    ).toBe(false);
  });

  it("rejects when OPENAI_API_KEY is missing", () => {
    const { OPENAI_API_KEY: _, ...rest } = baseValid;
    void _;
    expect(EnvSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when ENCRYPTION_KEY is malformed", () => {
    expect(
      EnvSchema.safeParse({ ...baseValid, ENCRYPTION_KEY: "too-short" }).success,
    ).toBe(false);
  });
});
