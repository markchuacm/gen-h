import { describe, expect, it } from "vitest";
import { ageFromDob } from "./blood-form.js";

describe("ageFromDob", () => {
  const now = new Date("2026-07-22T00:00:00.000Z");

  it("returns whole years for a past birthday this year", () => {
    expect(ageFromDob("1990-02-15", now)).toBe(36);
  });

  it("does not count a birthday that has not happened yet this year", () => {
    expect(ageFromDob("1990-12-31", now)).toBe(35);
  });

  it("counts the birthday on the day itself", () => {
    expect(ageFromDob("2000-07-22", now)).toBe(26);
  });

  it("returns null for a missing or malformed date", () => {
    expect(ageFromDob(null, now)).toBeNull();
    expect(ageFromDob("not-a-date", now)).toBeNull();
  });
});
