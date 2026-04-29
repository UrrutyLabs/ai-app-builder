import { describe, expect, it } from "vitest";
import { UpdateProjectInputSchema } from "./update-project-input";

describe("UpdateProjectInputSchema", () => {
  it("accepts a valid input", () => {
    const result = UpdateProjectInputSchema.safeParse({
      id: "proj_123",
      name: "Renamed",
      description: "An updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a missing description", () => {
    const result = UpdateProjectInputSchema.safeParse({
      id: "proj_123",
      name: "Renamed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = UpdateProjectInputSchema.safeParse({
      id: "proj_123",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing id", () => {
    const result = UpdateProjectInputSchema.safeParse({
      name: "Whatever",
    });
    expect(result.success).toBe(false);
  });
});
