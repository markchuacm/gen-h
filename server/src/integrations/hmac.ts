import { createHmac, timingSafeEqual } from "node:crypto";

export function createLabSignature(secret: string, timestamp: string, payload: Buffer): string {
  return `v1=${createHmac("sha256", secret).update(timestamp).update(".").update(payload).digest("hex")}`;
}

export function labSignatureMatches(secret: string, timestamp: string, payload: Buffer, supplied: string): boolean {
  if (!/^v1=[0-9a-fA-F]{64}$/.test(supplied)) return false;
  const expected = Buffer.from(createLabSignature(secret, timestamp, payload).slice(3), "hex");
  const actual = Buffer.from(supplied.slice(3), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
