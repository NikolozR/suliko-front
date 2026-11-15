// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Files that did not upload when an order was saved, kept for the order page.
 *
 * The form saves the order first and uploads after: a document has no folder
 * until it exists. When an upload fails the order is already there and the
 * form is on its way to the order page, so the failure has to be said on that
 * page, where the files can be added again. The tab's own storage is enough:
 * it is the same person, in the same tab, a second later.
 */

const key = (orderId: number) => `suliko:failed-uploads:${orderId}`;

/** `failures`: one line per file, "name" or "name: why". */
export function rememberFailedUploads(orderId: number, failures: string[]) {
  try {
    sessionStorage.setItem(key(orderId), JSON.stringify(failures));
  } catch {
    // Storage is blocked or full: the toast is all there is.
  }
}

export function readFailedUploads(orderId: number): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(key(orderId)) ?? "[]");
    return Array.isArray(stored) ? stored.filter((line) => typeof line === "string") : [];
  } catch {
    return [];
  }
}

export function forgetFailedUploads(orderId: number) {
  try {
    sessionStorage.removeItem(key(orderId));
  } catch {
    // Nothing was kept, then.
  }
}
