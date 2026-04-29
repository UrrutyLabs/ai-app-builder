import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function decodeKey(keyB64: string): Buffer {
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (decoded from base64)");
  }
  return key;
}

export function encrypt(plaintext: string, keyB64: string): string {
  const key = decodeKey(keyB64);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

export function decrypt(payloadB64: string, keyB64: string): string {
  const key = decodeKey(keyB64);
  const payload = Buffer.from(payloadB64, "base64");
  if (payload.length < IV_LEN + TAG_LEN) {
    throw new Error("Encrypted payload too short");
  }
  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(payload.length - TAG_LEN);
  const ciphertext = payload.subarray(IV_LEN, payload.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
