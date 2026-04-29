import { env } from "@repo/domain/env";
import { decrypt as decryptRaw, encrypt as encryptRaw } from "./encryption";

export function encryptToken(plaintext: string): string {
  return encryptRaw(plaintext, env.ENCRYPTION_KEY);
}

export function decryptToken(ciphertext: string): string {
  return decryptRaw(ciphertext, env.ENCRYPTION_KEY);
}
