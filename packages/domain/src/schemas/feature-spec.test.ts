import { describe, expect, it } from "vitest";
import { FeatureSpecSchema } from "./feature-spec";

const validSpec = {
  title: "Pickup notes on orders",
  problem: "Drivers miss customer instructions at pickup.",
  goal: "Let customers attach notes that drivers see at pickup time.",
  mode: "existing_system" as const,
  scope: {
    in: ["Add notes field to order create flow"],
    out: ["Notes after order completion"],
  },
  actors: ["customer", "driver"],
  userFlows: ["Customer creates order with notes"],
  uiStates: ["Notes textarea on order form"],
  businessRules: ["Notes max 500 chars"],
  dataChanges: ["Add Order.pickupNotes column"],
  apiChanges: ["POST /orders accepts pickupNotes"],
  acceptanceCriteria: ["Driver sees notes in pickup screen"],
  assumptions: ["Existing order schema is mutable"],
  openQuestions: ["Should notes be editable after creation?"],
};

describe("FeatureSpecSchema", () => {
  it("accepts a fully populated spec", () => {
    const result = FeatureSpecSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = FeatureSpecSchema.safeParse({ ...validSpec, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mode value", () => {
    const result = FeatureSpecSchema.safeParse({ ...validSpec, mode: "hybrid" });
    expect(result.success).toBe(false);
  });
});
