import { describe, expect, it } from "vitest";
import {
  generateTempPassword,
  inviteExpiresAt,
  isInviteExpired,
  isStillOnTempPassword,
  INVITE_TTL_DAYS,
} from "./invites.js";

describe("temp password generation", () => {
  it("is at least the minimum password length across the expected alphabets", () => {
    for (let i = 0; i < 50; i += 1) {
      const pw = generateTempPassword();
      expect(pw).toHaveLength(14);
      expect(pw).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it("does not repeat", () => {
    expect(generateTempPassword()).not.toEqual(generateTempPassword());
  });
});

describe("inviteExpiresAt", () => {
  it("is INVITE_TTL_DAYS ahead of the given time", () => {
    const from = new Date("2026-07-19T00:00:00.000Z");
    const expires = inviteExpiresAt(from);
    expect(expires.getTime() - from.getTime()).toBe(INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  });
});

describe("isStillOnTempPassword", () => {
  it("is true for a member who hasn't set a password or finished setup", () => {
    expect(isStillOnTempPassword({ role: "member", setupCompletedAt: null, passwordSetAt: null })).toBe(true);
  });

  it("is false once setup completes (e.g. Google-only member)", () => {
    expect(
      isStillOnTempPassword({ role: "member", setupCompletedAt: new Date(), passwordSetAt: null }),
    ).toBe(false);
  });

  it("is false once a password is set", () => {
    expect(isStillOnTempPassword({ role: "member", setupCompletedAt: null, passwordSetAt: new Date() })).toBe(false);
  });

  it("is false for staff", () => {
    expect(isStillOnTempPassword({ role: "admin", setupCompletedAt: null, passwordSetAt: null })).toBe(false);
  });
});

describe("isInviteExpired", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");
  const base = { role: "member" as const, setupCompletedAt: null, passwordSetAt: null };

  it("is expired when the temp window has lapsed and the member is still on it", () => {
    expect(
      isInviteExpired({ ...base, tempPasswordExpiresAt: "2026-07-18T00:00:00.000Z" }, now),
    ).toBe(true);
  });

  it("is not expired while the window is still open", () => {
    expect(
      isInviteExpired({ ...base, tempPasswordExpiresAt: "2026-07-25T00:00:00.000Z" }, now),
    ).toBe(false);
  });

  it("is never expired after the member sets a password", () => {
    expect(
      isInviteExpired(
        { ...base, passwordSetAt: new Date(), tempPasswordExpiresAt: "2026-07-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("is never expired after setup completes", () => {
    expect(
      isInviteExpired(
        { ...base, setupCompletedAt: new Date(), tempPasswordExpiresAt: "2026-07-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("is not expired when there is no expiry timestamp", () => {
    expect(isInviteExpired({ ...base, tempPasswordExpiresAt: null }, now)).toBe(false);
  });
});
