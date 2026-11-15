/**
 * A rough price in a currency the visitor knows, shown small under the lari
 * price. It is a display aid with fixed, rounded rates, never charged: update
 * the rates when the lari moves by more than a few percent.
 */
const GEL_PER_USD = 2.7;
const GEL_PER_EUR = 3.1;

/** "≈ $7" for English, "≈ 16 €" for Polish, nothing for Georgian (they know the lari). */
export function approxPrice(gel: number, locale: string): string | null {
  if (!Number.isFinite(gel) || gel <= 0) return null;
  if (locale === "en") return `≈ $${Math.round(gel / GEL_PER_USD)}`;
  if (locale === "pl") return `≈ ${Math.round(gel / GEL_PER_EUR)} €`;
  return null;
}
