// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * What an order is calculated by: its pages, or its characters.
 *
 * The choice is made per order. The bureau's setting (Settings > General) is
 * only where a new order starts. It is not stored on the order: a written
 * line carries a character count when it is calculated by characters, so the
 * order's unit is read back from its lines, and the API prices each line from
 * its count when it has one.
 */
export type PricingUnit = "pages" | "characters";

export const PRICING_UNITS: readonly PricingUnit[] = ["pages", "characters"];

/**
 * The unit of an order's lines. Characters as soon as any written line has a
 * count, so a count already saved is never dropped by opening the order; pages
 * when written lines have none; `fallback` (the bureau's default) when there
 * is no written line to tell from, as on a new order or one of interpreting
 * only.
 */
export function unitOfDocuments(
  documents:
    | readonly { service_type?: string | null; character_count?: number | null }[]
    | null
    | undefined,
  fallback: PricingUnit = "pages",
): PricingUnit {
  const written = (documents ?? []).filter((d) => d.service_type !== "oral");
  if (written.length === 0) return fallback;
  return written.some((d) => d.character_count) ? "characters" : "pages";
}
