/**
 * A rough price in a currency the visitor knows, shown small under the lari
 * price. It is a display aid with fixed, rounded rates, never charged: update
 * the rate when the lari moves by more than a few percent.
 */
const GEL_PER_EUR = 3.1;

/** "≈ 6 €" for English and Polish, nothing for Georgian (they know the lari). */
export function approxPrice(gel: number, locale: string): string | null {
  if (!Number.isFinite(gel) || gel <= 0) return null;
  if (locale === "en" || locale === "pl") return `≈ ${Math.round(gel / GEL_PER_EUR)} €`;
  return null;
}
