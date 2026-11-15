// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * What kind of work a translator takes, as the one dropdown the forms show.
 *
 * The API keeps two flags (`works_written`, `works_oral`); the dropdown is
 * only a nicer way to set them, so nothing changes on the server. Notarising
 * is separate: it combines with any of the three.
 */
export const WORK_KINDS = ["written", "oral", "both"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/** The dropdown's value for a translator's two flags. Neither counts as written. */
export function workKindOf(written: boolean, oral: boolean): WorkKind {
  if (written && oral) return "both";
  return oral ? "oral" : "written";
}

/** The two API flags for a submitted dropdown value; anything else is written. */
export function workFlags(kind: string | null | undefined): {
  works_written: boolean;
  works_oral: boolean;
} {
  return {
    works_written: kind !== "oral",
    works_oral: kind === "oral" || kind === "both",
  };
}
