// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * "It worked" after an action that navigates away.
 *
 * Creating a client or deleting an order ends in a redirect, so the page that
 * ran the action is gone before it could say anything, and nothing confirmed
 * the save (audit F07). The action adds `?done=<key>` to where it sends the
 * person; `FlashToast` in the app shell shows the matching toast on arrival
 * and takes the flag back out of the address.
 */

export const FLASH_KEYS = [
  "clientCreated",
  "clientSaved",
  "clientDeleted",
  "orderCreated",
  "orderSaved",
  "orderDeleted",
  "documentDeleted",
  "notaryCreated",
  "notarySaved",
  "notaryDeleted",
  "translatorCreated",
  "translatorSaved",
  "translatorDeleted",
  "inviteCancelled",
  "userSaved",
  "userRemoved",
  "invitationMoved",
  "paymentRecorded",
  "payoutRecorded",
  "expenseAdded",
  "entryDeleted",
] as const;

export type FlashKey = (typeof FLASH_KEYS)[number];

export const FLASH_PARAM = "done";

export function isFlashKey(value: string | null): value is FlashKey {
  return (FLASH_KEYS as readonly string[]).includes(value ?? "");
}

/**
 * Why someone was sent away from a page they asked for: the plan does not
 * include it, or their role does not reach it. Shown by `FlashToast` too.
 */
export const DENIED_PARAM = "denied";
export type DeniedReason = "plan" | "role";

export function deniedQuery(reason: DeniedReason): string {
  return `${DENIED_PARAM}=${reason}`;
}

/** `path` with the flag that makes its page announce `key`. */
export function withFlash(path: string, key: FlashKey): string {
  const [base, hash = ""] = path.split("#", 2);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${FLASH_PARAM}=${key}${hash ? `#${hash}` : ""}`;
}
