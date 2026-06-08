import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_HEX = process.env.EMAIL_ENCRYPTION_KEY ?? "";

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error("EMAIL_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(KEY_HEX, "hex");
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(24) + tag(32) + ciphertext — all hex
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
}

export function decryptSecret(encoded: string): string {
  const key = getKey();
  const iv = Buffer.from(encoded.slice(0, 24), "hex");
  const tag = Buffer.from(encoded.slice(24, 56), "hex");
  const ciphertext = Buffer.from(encoded.slice(56), "hex");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}
