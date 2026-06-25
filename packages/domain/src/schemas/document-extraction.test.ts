import { describe, expect, it } from "vitest";
import {
  DocumentExtractionSchema,
  ExtractFromDocumentInputSchema,
} from "./document-extraction";

describe("DocumentExtractionSchema", () => {
  it("accepts a full extraction with detected siblings", () => {
    const result = DocumentExtractionSchema.safeParse({
      title: "Pickup notes",
      idea: "Drivers see customer pickup instructions on an order.",
      decisions: ["Notes are visible only to drivers"],
      constraints: ["Must not require a migration"],
      openQuestions: ["Can drivers edit after pickup?"],
      otherFeaturesDetected: ["Refund policy", "Push notifications"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty arrays (thin or single-feature document)", () => {
    const result = DocumentExtractionSchema.safeParse({
      title: "Pickup notes",
      idea: "Drivers see pickup instructions.",
      decisions: [],
      constraints: [],
      openQuestions: [],
      otherFeaturesDetected: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing idea", () => {
    const result = DocumentExtractionSchema.safeParse({
      title: "Pickup notes",
      decisions: [],
      constraints: [],
      openQuestions: [],
      otherFeaturesDetected: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("ExtractFromDocumentInputSchema", () => {
  it("requires projectId and contextDocId", () => {
    expect(
      ExtractFromDocumentInputSchema.safeParse({ projectId: "p1" }).success,
    ).toBe(false);
    expect(
      ExtractFromDocumentInputSchema.safeParse({
        projectId: "p1",
        contextDocId: "d1",
      }).success,
    ).toBe(true);
  });
});
