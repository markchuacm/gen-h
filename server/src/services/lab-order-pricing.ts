export const LAB_ORDER_PRICING_VERSION = 2;
export const LAB_ORDER_CURRENCY = "MYR";
export const LAB_ORDER_BASE_AMOUNT_MINOR = 140_000;
export const LAB_ORDER_OMISSION_AMOUNT_MINOR = 1_000;
export const LAB_ORDER_FOUNDING_DISCOUNT_MINOR = 20_000;
export const LAB_ORDER_MINIMUM_AMOUNT_MINOR = 98_000;

export type LabOrderQuote = {
  pricingVersion: number;
  currency: typeof LAB_ORDER_CURRENCY;
  catalogCount: number;
  selectedCount: number;
  baseAmountMinor: number;
  personalizationDiscountMinor: number;
  foundingDiscountMinor: number;
  isFoundingMember: boolean;
  totalAmountMinor: number;
};

export function validateLabOrderCodes(
  requestedCodes: string[],
  activeCodes: Iterable<string>,
): { codes: string[]; invalidCodes: string[] } {
  const codes = [...new Set(requestedCodes)];
  if (codes.length === 0) throw new RangeError("At least one biomarker is required");
  const active = new Set(activeCodes);
  return {
    codes,
    invalidCodes: codes.filter((code) => !active.has(code)),
  };
}

/** Calculate only the discount that can actually be applied. Once the package
 * reaches its RM980 minimum, further clinical omissions do not create a
 * misleading discount that would make the visible line items stop adding up. */
export function calculateLabOrderQuote(input: {
  catalogCount: number;
  selectedCount: number;
  isFoundingMember: boolean;
}): LabOrderQuote {
  if (!Number.isInteger(input.catalogCount) || input.catalogCount < 1) {
    throw new RangeError("catalogCount must be a positive integer");
  }
  if (
    !Number.isInteger(input.selectedCount)
    || input.selectedCount < 1
    || input.selectedCount > input.catalogCount
  ) {
    throw new RangeError("selectedCount must be between 1 and catalogCount");
  }

  const foundingDiscountMinor = input.isFoundingMember
    ? LAB_ORDER_FOUNDING_DISCOUNT_MINOR
    : 0;
  const rawPersonalizationDiscountMinor =
    (input.catalogCount - input.selectedCount) * LAB_ORDER_OMISSION_AMOUNT_MINOR;
  const maximumPersonalizationDiscountMinor = Math.max(
    0,
    LAB_ORDER_BASE_AMOUNT_MINOR
      - foundingDiscountMinor
      - LAB_ORDER_MINIMUM_AMOUNT_MINOR,
  );
  const personalizationDiscountMinor = Math.min(
    rawPersonalizationDiscountMinor,
    maximumPersonalizationDiscountMinor,
  );
  const totalAmountMinor =
    LAB_ORDER_BASE_AMOUNT_MINOR
    - foundingDiscountMinor
    - personalizationDiscountMinor;

  return {
    pricingVersion: LAB_ORDER_PRICING_VERSION,
    currency: LAB_ORDER_CURRENCY,
    catalogCount: input.catalogCount,
    selectedCount: input.selectedCount,
    baseAmountMinor: LAB_ORDER_BASE_AMOUNT_MINOR,
    personalizationDiscountMinor,
    foundingDiscountMinor,
    isFoundingMember: input.isFoundingMember,
    totalAmountMinor,
  };
}
