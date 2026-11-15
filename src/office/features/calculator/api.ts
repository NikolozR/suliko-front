// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { ReferenceData } from "@office/features/calculator/types";
import { api } from "@office/shared/lib/api";

/**
 * Reference data for the order builder and calculator dropdowns.
 *
 * Always live, like every other call in this module — see the note in
 * `shared/lib/api.ts`. This used to opt into Next's data cache
 * (`revalidate: 60, tags: ["reference"]`), reasoned as "the live quote must
 * not re-fetch on every keystroke". That reasoning didn't hold: this function
 * runs once per page render (Calculator, the order builder, the orders list,
 * an order's detail page, the dashboard) — the actual per-keystroke traffic is
 * the debounced POST to `/api/v1/calculator/quote`, which was never cached.
 * So the cache bought nothing and cost real correctness: adding a language
 * pair or a rate in Settings revalidates the tag on the server process that
 * handled the save, but a self-hosted deployment with more than one Node
 * process (or an edge/serverless instance the next request happens to land
 * on) can keep serving the old reference data — reproduced as "the new price
 * doesn't show up until I sign out and back in". Document types, rates and
 * language pairs change rarely and this fetch is cheap; there is no case
 * where a 60-second-stale price list is worth that failure mode.
 */
export async function getReference(): Promise<ReferenceData> {
  return api<ReferenceData>("/api/v1/reference");
}
