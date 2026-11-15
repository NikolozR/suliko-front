// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * "2026-10" as "October 2026" (or in Georgian), in the viewer's language.
 *
 * A period is a calendar month with no day and no zone, so it is read as the
 * first of the month in UTC and printed in UTC: no zone can move it to the
 * month before.
 */
export function monthLabel(period: string, locale: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    locale === "ka" ? "ka-GE" : "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}

/** The month before or after "2026-10": "2026-09", "2026-11". */
export function shiftMonth(period: string, by: number): string {
  const [year, month] = period.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The share of the included orders used, 0 to 100, for a bar. */
export function usedPercent(orders: number, included: number): number {
  if (included <= 0) return 100;
  return Math.min(100, Math.round((orders / included) * 100));
}
