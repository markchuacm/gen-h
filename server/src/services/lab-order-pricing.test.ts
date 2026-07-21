import { describe, expect, it } from "vitest";
import {
  calculateLabOrderQuote,
  LAB_ORDER_MINIMUM_AMOUNT_MINOR,
  validateLabOrderCodes,
} from "./lab-order-pricing.js";

describe("lab-order pricing", () => {
  it("quotes RM1,200 for a founding member with all 103 biomarkers", () => {
    expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount: 103, isFoundingMember: true }))
      .toMatchObject({
        baseAmountMinor: 140_000,
        personalizationDiscountMinor: 0,
        foundingDiscountMinor: 20_000,
        totalAmountMinor: 120_000,
      });
  });

  it("applies RM20 per omission until the RM980 floor", () => {
    expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount: 102, isFoundingMember: true }))
      .toMatchObject({ personalizationDiscountMinor: 2_000, totalAmountMinor: 118_000 });
    expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount: 92, isFoundingMember: true }))
      .toMatchObject({ personalizationDiscountMinor: 22_000, totalAmountMinor: 98_000 });
  });

  it("caps the visible personalization discount at the applied amount", () => {
    expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount: 1, isFoundingMember: true }))
      .toMatchObject({ personalizationDiscountMinor: 22_000, totalAmountMinor: 98_000 });
  });

  it("omits the founding discount for an ineligible member", () => {
    expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount: 103, isFoundingMember: false }))
      .toMatchObject({ foundingDiscountMinor: 0, totalAmountMinor: 140_000 });
  });

  it("never produces a total below the minimum", () => {
    for (let selectedCount = 1; selectedCount <= 103; selectedCount += 1) {
      for (const isFoundingMember of [true, false]) {
        expect(calculateLabOrderQuote({ catalogCount: 103, selectedCount, isFoundingMember }).totalAmountMinor)
          .toBeGreaterThanOrEqual(LAB_ORDER_MINIMUM_AMOUNT_MINOR);
      }
    }
  });

  it("rejects empty or impossible selections", () => {
    expect(() => calculateLabOrderQuote({ catalogCount: 103, selectedCount: 0, isFoundingMember: true }))
      .toThrow(RangeError);
    expect(() => calculateLabOrderQuote({ catalogCount: 103, selectedCount: 104, isFoundingMember: true }))
      .toThrow(RangeError);
  });

  it("deduplicates selected codes before pricing", () => {
    expect(validateLabOrderCodes(["a", "a", "b"], ["a", "b", "c"]))
      .toEqual({ codes: ["a", "b"], invalidCodes: [] });
  });

  it("identifies unknown and retired codes and rejects empty panels", () => {
    expect(validateLabOrderCodes(["active", "retired", "unknown"], ["active"]))
      .toEqual({ codes: ["active", "retired", "unknown"], invalidCodes: ["retired", "unknown"] });
    expect(() => validateLabOrderCodes([], ["active"])).toThrow(RangeError);
  });
});
