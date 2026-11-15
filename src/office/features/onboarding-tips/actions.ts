"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { api } from "@office/shared/lib/api";

/**
 * Saves which first-run tips this person has seen.
 *
 * Best effort: a tip that is not remembered shows again next visit, which is
 * a nuisance and not worth an error on screen. An API that predates the
 * endpoint answers 404 and is ignored the same way.
 */
export async function saveTipsAction(update: { seen: string[] } | { reset: true }): Promise<void> {
  try {
    await api("/api/v1/auth/tips", { method: "PATCH", body: update });
  } catch {
    // Nothing to tell the person; see above.
  }
}
