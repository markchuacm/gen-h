import type { LabOrderQuote } from "./api/labOrder";

export function formatMyr(amountMinor: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function memberQuoteSummary(quote: LabOrderQuote): string {
  const lines = [
    `Advanced Blood Baseline — ${formatMyr(quote.baseAmountMinor)}`,
    "Inclusive of:",
    "• Personalized advanced blood test",
    "• Results interpretation",
    "• Personalized care plan construction",
    "• 2nd teleconsult with doctor",
  ];
  if (quote.personalizationDiscountMinor > 0) {
    lines.push(`Doctor personalization — -${formatMyr(quote.personalizationDiscountMinor)}`);
  }
  if (quote.foundingDiscountMinor > 0) {
    lines.push(`Founding member discount — -${formatMyr(quote.foundingDiscountMinor)}`);
  }
  lines.push(`Your price — ${formatMyr(quote.totalAmountMinor)}`);
  lines.push("A Verae support member will be in touch after this teleconsult to guide you on next steps.");
  return lines.join("\n");
}
