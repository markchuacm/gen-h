import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config.js";

function key(): Buffer {
  if (!env.PARTNER_CREDENTIAL_ENCRYPTION_KEY) {
    if (env.NODE_ENV === "production") throw new Error("Partner credential encryption key is not configured");
    return Buffer.from("development-partner-key-32-bytes!", "utf8").subarray(0, 32);
  }
  const decoded = Buffer.from(env.PARTNER_CREDENTIAL_ENCRYPTION_KEY, "base64");
  if (decoded.length !== 32) throw new Error("PARTNER_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes");
  return decoded;
}

export function encryptPartnerSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptPartnerSecret(value: string): string {
  const [version, ivPart, tagPart, bodyPart] = value.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !bodyPart) throw new Error("Unsupported partner credential format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(bodyPart, "base64url")), decipher.final()]).toString("utf8");
}
