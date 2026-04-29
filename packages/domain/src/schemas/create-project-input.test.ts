import { describe, expect, it } from "vitest";
import { CreateProjectInputSchema } from "./create-project-input";

describe("CreateProjectInputSchema", () => {
  it("accepts a minimal valid input", () => {
    const result = CreateProjectInputSchema.safeParse({
      name: "My project",
      mode: "greenfield",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = CreateProjectInputSchema.safeParse({
      name: "",
      mode: "greenfield",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mode", () => {
    const result = CreateProjectInputSchema.safeParse({
      name: "My project",
      mode: "wishful_thinking",
    });
    expect(result.success).toBe(false);
  });
});
