import { describe, expect, it } from "vitest";
import {
  ExtractFromTranscriptInputSchema,
  TranscriptContextSchema,
  TranscriptExtractionSchema,
} from "./transcript-extraction";

describe("TranscriptExtractionSchema", () => {
  it("accepts a valid extraction", () => {
    const result = TranscriptExtractionSchema.safeParse({
      title: "Pickup notes on orders",
      idea: "Add a notes field on orders so drivers see customer instructions.",
      decisions: ["Notes are visible only to drivers, not customers."],
      constraints: ["Must work on existing Order model without migration."],
      openQuestions: ["Should notes be editable after order is placed?"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when title is missing", () => {
    const result = TranscriptExtractionSchema.safeParse({
      idea: "x",
      decisions: [],
      constraints: [],
      openQuestions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects when a bullet exceeds the per-bullet length cap", () => {
    const longBullet = "x".repeat(401);
    const result = TranscriptExtractionSchema.safeParse({
      title: "t",
      idea: "i",
      decisions: [longBullet],
      constraints: [],
      openQuestions: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("TranscriptContextSchema", () => {
  it("accepts empty arrays (e.g. transcript with no concrete decisions)", () => {
    const result = TranscriptContextSchema.safeParse({
      decisions: [],
      constraints: [],
      openQuestions: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("ExtractFromTranscriptInputSchema", () => {
  it("rejects transcripts shorter than the minimum useful length", () => {
    const result = ExtractFromTranscriptInputSchema.safeParse({
      projectId: "p1",
      transcript: "too short",
    });
    expect(result.success).toBe(false);
  });
});
