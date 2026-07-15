import { describe, expect, it } from "vitest";
import { createLabSignature, labSignatureMatches } from "./hmac.js";

describe("laboratory HMAC", () => {
  const secret = "test-secret-with-enough-randomness";
  const timestamp = "2026-07-15T04:30:00.000Z";
  const payload = Buffer.from('{"event_id":"evt-1"}');

  it("accepts the exact timestamp and payload", () => {
    const signature = createLabSignature(secret, timestamp, payload);
    expect(labSignatureMatches(secret, timestamp, payload, signature)).toBe(true);
  });

  it("rejects changed bytes and malformed signatures", () => {
    const signature = createLabSignature(secret, timestamp, payload);
    expect(labSignatureMatches(secret, timestamp, Buffer.from('{"event_id":"evt-2"}'), signature)).toBe(false);
    expect(labSignatureMatches(secret, timestamp, payload, "v1=not-hex")).toBe(false);
  });
});
