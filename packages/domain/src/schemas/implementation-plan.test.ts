import { describe, expect, it } from "vitest";
import { ImplementationPlanSchema } from "./implementation-plan";

const validPlan = {
  summary: "Add a pickupNotes column and surface it in the driver pickup screen.",
  affectedAreas: ["frontend", "backend", "database"] as const,
  fileChanges: [
    {
      path: "prisma/schema.prisma",
      action: "modify" as const,
      summary: "Add pickupNotes column to Order model",
    },
  ],
  steps: [
    {
      title: "Add pickupNotes column",
      description: "Migrate the Order model to include the new column.",
      area: "database" as const,
    },
    {
      title: "Render notes on driver screen",
      description: "Add a notes block above the pickup confirmation button.",
      area: "frontend" as const,
    },
  ],
  testPlan: [
    "Unit: Order schema validates pickupNotes max length 500.",
    "Manual: driver app shows the note when present.",
  ],
  risks: [
    {
      description: "Existing orders have no pickupNotes (null).",
      mitigation: "Render an empty state in the UI when the column is null.",
    },
  ],
};

describe("ImplementationPlanSchema", () => {
  it("accepts a fully populated plan", () => {
    expect(ImplementationPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it("rejects when steps array is empty", () => {
    const result = ImplementationPlanSchema.safeParse({ ...validPlan, steps: [] });
    expect(result.success).toBe(false);
  });

  it("rejects when risks array is empty", () => {
    const result = ImplementationPlanSchema.safeParse({ ...validPlan, risks: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown area on a step", () => {
    const result = ImplementationPlanSchema.safeParse({
      ...validPlan,
      steps: [
        {
          title: "Do thing",
          description: "Explanation",
          area: "marketing",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown action on a fileChange", () => {
    const result = ImplementationPlanSchema.safeParse({
      ...validPlan,
      fileChanges: [
        { path: "x.ts", action: "rename", summary: "rename" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
