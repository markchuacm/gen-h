import { describe, expect, it, vi, afterEach } from "vitest";
import { combinePhone, dobFromIc, splitPhone } from "./identityFields";

afterEach(() => vi.useRealTimers());

describe("dobFromIc", () => {
  it("derives yyyy-mm-dd from the first six IC digits (YYMMDD)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T00:00:00Z"));
    // 90 > 26 → 1900s
    expect(dobFromIc("900215-14-5566")).toBe("1990-02-15");
    // 05 <= 26 → 2000s
    expect(dobFromIc("050320101234")).toBe("2005-03-20");
  });

  it("ignores non-digits and partial input", () => {
    expect(dobFromIc("90")).toBeNull();
    expect(dobFromIc("")).toBeNull();
  });

  it("rejects impossible calendar dates", () => {
    expect(dobFromIc("901332145566")).toBeNull(); // month 13, day 32
    expect(dobFromIc("900230145566")).toBeNull(); // Feb 30
  });
});

describe("phone split/combine", () => {
  it("splits a stored number into a known country code and the rest", () => {
    expect(splitPhone("+60123456789")).toEqual({ code: "+60", national: "123456789" });
    expect(splitPhone("+6591234567")).toEqual({ code: "+65", national: "91234567" });
  });

  it("defaults to +60 when no known code prefixes the value", () => {
    expect(splitPhone("0123456789")).toEqual({ code: "+60", national: "0123456789" });
    expect(splitPhone("")).toEqual({ code: "+60", national: "" });
  });

  it("recombines code and national number, dropping non-digits", () => {
    expect(combinePhone("+60", "12-345 6789")).toBe("+60123456789");
  });

  it("stores an empty string when the national number is blank", () => {
    expect(combinePhone("+60", "")).toBe("");
  });
});
