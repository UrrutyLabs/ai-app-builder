import { describe, expect, it } from "vitest";
import { CreateFeatureInputSchema } from "./create-feature-input";

describe("CreateFeatureInputSchema", () => {
  it("accepts a minimal valid input", () => {
    const result = CreateFeatureInputSchema.safeParse({
      projectId: "abc123",
      title: "Pickup notes",
      idea: "I want to add pickup notes to orders",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty idea", () => {
    const result = CreateFeatureInputSchema.safeParse({
      projectId: "abc123",
      title: "Pickup notes",
      idea: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when title exceeds the max length", () => {
    const result = CreateFeatureInputSchema.safeParse({
      projectId: "abc123",
      title: "a".repeat(121),
      idea: "Add pickup notes",
    });
    expect(result.success).toBe(false);
  });
});
