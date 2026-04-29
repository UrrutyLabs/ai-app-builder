import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

const KEY = "DXvV8ZMr9dAB9BEKejubwyzVxkbovGmNOPUgIdKn8PQ=";
const OTHER_KEY = "ZFKaH7PvqHjmFFNkUg5DpL2ZgPK1AaNlPAxRkY9zZjE=";

describe("encryption", () => {
  it("round-trips a value", () => {
    const ciphertext = encrypt("ghp_xxxx", KEY);
    expect(ciphertext).not.toBe("ghp_xxxx");
    expect(decrypt(ciphertext, KEY)).toBe("ghp_xxxx");
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    expect(encrypt("same", KEY)).not.toBe(encrypt("same", KEY));
  });

  it("throws when decrypting with the wrong key", () => {
    const ciphertext = encrypt("secret", KEY);
    expect(() => decrypt(ciphertext, OTHER_KEY)).toThrow();
  });

  it("throws on a malformed payload", () => {
    expect(() => decrypt("not-valid-base64-too-short", KEY)).toThrow();
  });

  it("throws on a key of wrong length", () => {
    const shortKey = Buffer.from("short").toString("base64");
    expect(() => encrypt("x", shortKey)).toThrow(/32 bytes/);
  });
});
