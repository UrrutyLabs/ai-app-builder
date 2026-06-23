import { describe, expect, it } from "vitest";
import { UploadContextDocInputSchema } from "./context-doc";

describe("UploadContextDocInputSchema", () => {
  it("accepts a valid markdown doc", () => {
    const result = UploadContextDocInputSchema.safeParse({
      projectId: "p1",
      title: "Orders PRD",
      content: "# Orders\n\nDrivers need pickup notes.",
      mimeType: "text/markdown",
    });
    expect(result.success).toBe(true);
  });

  it("rejects content over the size cap", () => {
    const result = UploadContextDocInputSchema.safeParse({
      projectId: "p1",
      title: "Huge",
      content: "x".repeat(500_001),
      mimeType: "text/plain",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported mime type", () => {
    const result = UploadContextDocInputSchema.safeParse({
      projectId: "p1",
      title: "Binary",
      content: "whatever",
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});
