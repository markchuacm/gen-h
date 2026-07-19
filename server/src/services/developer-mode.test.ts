import { describe, expect, it } from "vitest";
import { createDeveloperModeToken, readCookie, verifyDeveloperModeToken } from "./developer-mode.js";

describe("developer mode grants", () => {
  const now = new Date("2026-07-19T10:00:00.000Z");
  const secret = "a-development-secret-that-is-long-enough";

  it("accepts a signed, unexpired grant for the same admin", () => {
    const { token } = createDeveloperModeToken("admin-1", secret, now);
    expect(verifyDeveloperModeToken(token, "admin-1", secret, now)?.userId).toBe("admin-1");
  });

  it("rejects another admin, expiry, and tampering", () => {
    const { token, expiresAt } = createDeveloperModeToken("admin-1", secret, now);
    expect(verifyDeveloperModeToken(token, "admin-2", secret, now)).toBeNull();
    expect(verifyDeveloperModeToken(token, "admin-1", secret, expiresAt)).toBeNull();
    expect(verifyDeveloperModeToken(`${token}x`, "admin-1", secret, now)).toBeNull();
  });
});

describe("readCookie", () => {
  it("reads an exact cookie name", () => {
    expect(readCookie("session=abc; verae_developer_mode=grant; other=1", "verae_developer_mode")).toBe("grant");
  });
});
