import { describe, expect, it } from "vitest";
import { NewDecisionSchema } from "./decision";

describe("NewDecisionSchema", () => {
  it("accepts a valid machine-distilled decision", () => {
    const result = NewDecisionSchema.safeParse({
      kind: "DECISION",
      status: "ACCEPTED",
      statement: "Use SAML, not OIDC, for enterprise SSO",
      sourceType: "TRANSCRIPT",
      createdBy: "ai",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an open question with a null source id", () => {
    const result = NewDecisionSchema.safeParse({
      kind: "OPEN_QUESTION",
      status: "OPEN",
      statement: "Do we need SCIM provisioning for v1?",
      sourceType: "TRANSCRIPT",
      sourceId: null,
      createdBy: "ai",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty statement", () => {
    const result = NewDecisionSchema.safeParse({
      kind: "DECISION",
      status: "ACCEPTED",
      statement: "",
      sourceType: "TRANSCRIPT",
      createdBy: "ai",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const result = NewDecisionSchema.safeParse({
      kind: "GUESS",
      status: "ACCEPTED",
      statement: "Something",
      sourceType: "TRANSCRIPT",
      createdBy: "ai",
    });
    expect(result.success).toBe(false);
  });
});
