// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The last few orders opened in this browser, which the quick search offers
 * before anything is typed.
 *
 * Kept in localStorage, per organisation: someone who works in two bureaus
 * must not be offered one's orders while in the other (the API would refuse
 * to open them anyway). It is a convenience, not a record: a browser that
 * blocks storage simply has no list, and signing out empties it, since the
 * entries carry client names.
 */

const KEY = "suliko:recent-orders";
const LIMIT = 5;

export interface RecentOrder {
  id: number;
  /** The bureau's own number: what people see. */
  number: number;
  clientName: string;
}

type Store = Record<string, RecentOrder[]>;

function read(): Store {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

/** The orders last opened in `scope` (the organisation's slug), newest first. */
export function readRecentOrders(scope: string): RecentOrder[] {
  const list = read()[scope];
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (order) =>
        typeof order?.id === "number" &&
        typeof order.number === "number" &&
        typeof order.clientName === "string",
    )
    .slice(0, LIMIT);
}

/** Put `order` at the top of the list for `scope`. */
export function rememberOrder(scope: string, order: RecentOrder): void {
  try {
    const store = read();
    const others = readRecentOrders(scope).filter((entry) => entry.id !== order.id);
    store[scope] = [order, ...others].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage is full or blocked: there is nothing to do about it.
  }
}

/** Empty the list for every organisation. Called on signing out. */
export function forgetRecentOrders(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // As above.
  }
}
