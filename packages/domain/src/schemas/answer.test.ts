import { describe, expect, it } from "vitest";
import { AnswerSchema, AnswerListSchema } from "./answer";

describe("AnswerSchema", () => {
  it("accepts a valid answer", () => {
    const result = AnswerSchema.safeParse({ questionId: "q1", text: "yes" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty questionId", () => {
    const result = AnswerSchema.safeParse({ questionId: "", text: "yes" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty text", () => {
    const result = AnswerSchema.safeParse({ questionId: "q1", text: "" });
    expect(result.success).toBe(false);
  });
});

describe("AnswerListSchema", () => {
  it("accepts an empty array", () => {
    expect(AnswerListSchema.safeParse([]).success).toBe(true);
  });

  it("rejects when an entry is malformed", () => {
    const result = AnswerListSchema.safeParse([{ questionId: "q1", text: "" }]);
    expect(result.success).toBe(false);
  });
});
