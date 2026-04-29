import { describe, expect, it } from "vitest";
import { QuestionSchema, QuestionListSchema } from "./question";

describe("QuestionSchema", () => {
  it("accepts a valid question", () => {
    const result = QuestionSchema.safeParse({ id: "q1", text: "Who uses this?" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty id", () => {
    const result = QuestionSchema.safeParse({ id: "", text: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty text", () => {
    const result = QuestionSchema.safeParse({ id: "q1", text: "" });
    expect(result.success).toBe(false);
  });
});

describe("QuestionListSchema", () => {
  it("accepts an empty array", () => {
    expect(QuestionListSchema.safeParse([]).success).toBe(true);
  });

  it("rejects when an entry is malformed", () => {
    const result = QuestionListSchema.safeParse([{ id: "q1", text: "" }]);
    expect(result.success).toBe(false);
  });
});
