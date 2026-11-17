/**
 * A rough price in a currency the visitor knows, shown small under the lari
 * price. It is a display aid with a fixed, rounded rate, never charged:
 * update the rate when the lari moves by more than a few percent.
 *
 * English shows euros as the primary price itself (see PricingSection's
 * `priceFor`/`toEuro`), so it has no need for this secondary hint.
 */
const GEL_PER_EUR = 3.1;

/** "≈ 16 €" for Polish, nothing for Georgian or English. */
export function approxPrice(gel: number, locale: string): string | null {
  if (!Number.isFinite(gel) || gel <= 0) return null;
  if (locale === "pl") return `≈ ${Math.round(gel / GEL_PER_EUR)} €`;
  return null;
}
