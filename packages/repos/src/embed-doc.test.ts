import { describe, expect, it } from "vitest";
import { chunkDocContent, MAX_CHUNKS_PER_DOC } from "./embed-doc";

describe("chunkDocContent", () => {
  it("returns a single chunk for short content", () => {
    const chunks = chunkDocContent("# Title\n\nA short paragraph.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.chunkIx).toBe(0);
    expect(chunks[0]?.content).toContain("short paragraph");
  });

  it("packs multiple small paragraphs and splits when over target", () => {
    // 5 paragraphs of ~500 chars each = ~2500 chars → at least 2 chunks at 1500 target.
    const para = "x".repeat(500);
    const content = Array.from({ length: 5 }, () => para).join("\n\n");
    const chunks = chunkDocContent(content);
    expect(chunks.length).toBeGreaterThan(1);
    // chunkIx is contiguous from 0.
    chunks.forEach((c, i) => expect(c.chunkIx).toBe(i));
  });

  it("hard-splits a single oversized paragraph", () => {
    const huge = "y".repeat(5000);
    const chunks = chunkDocContent(huge);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  it("caps chunk count at MAX_CHUNKS_PER_DOC", () => {
    // Many distinct paragraphs, each its own chunk-ish.
    const content = Array.from({ length: 300 }, (_, i) =>
      `paragraph number ${i} ` + "z".repeat(1400),
    ).join("\n\n");
    const chunks = chunkDocContent(content);
    expect(chunks.length).toBeLessThanOrEqual(MAX_CHUNKS_PER_DOC);
  });

  it("returns empty for whitespace-only content", () => {
    expect(chunkDocContent("   \n\n   ")).toHaveLength(0);
  });
});
