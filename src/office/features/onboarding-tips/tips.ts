// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The first-run tips: what each one points at, and in what order the tour
 * walks them.
 *
 * The ids are the API's (`TIP_IDS` in api.suliko.ge `domain/tips.py`) and the
 * message keys under `tips.items`. A tip is a hotspot on a real element
 * carrying `data-tip="<id>"`; where the element is absent (another plan, no
 * permission, a different page) the tip simply does not show.
 */

export const TIP_IDS = [
  "nav-translations",
  "nav-clients",
  "nav-translators",
  "nav-calculator",
  "nav-finances",
  "translations-new",
  "order-translate-send",
  "users-invite",
] as const;

export type TipId = (typeof TIP_IDS)[number];

export function isTipId(value: string): value is TipId {
  return (TIP_IDS as readonly string[]).includes(value);
}

export interface TipDef {
  id: TipId;
  placement: "right" | "bottom" | "left" | "top";
  /**
   * The page the tour opens to reach this tip, when it is not in the shell.
   * Null: the tour skips it (the order page needs an order to exist).
   */
  tourPath?: string | null;
  /** Sidebar entry that must exist for the tour to open `tourPath`. */
  tourNeeds?: TipId | "nav-users";
  /**
   * The sidebar entry a page tip hangs on. Without it (another plan, no
   * permission) the tip can never show, so it is not counted in "2 of 8".
   */
  needs?: TipId | "nav-users";
}

export const TIPS: readonly TipDef[] = [
  { id: "nav-translations", placement: "right" },
  { id: "nav-clients", placement: "right" },
  { id: "nav-translators", placement: "right" },
  { id: "nav-calculator", placement: "right" },
  { id: "nav-finances", placement: "right" },
  {
    id: "translations-new",
    placement: "bottom",
    tourPath: "/translations",
    tourNeeds: "nav-translations",
    needs: "nav-translations",
  },
  { id: "order-translate-send", placement: "left", tourPath: null, needs: "nav-translations" },
  {
    id: "users-invite",
    placement: "bottom",
    tourPath: "/users",
    tourNeeds: "nav-users",
    needs: "nav-users",
  },
];

export const tipSelector = (id: string) => `[data-tip="${id}"]`;
