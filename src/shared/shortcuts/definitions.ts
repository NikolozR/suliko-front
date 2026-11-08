export type ShortcutGroup = "navigation" | "translation" | "general";

export interface ShortcutInfo {
  id: string;
  /** Key caps in order. "mod" is Ctrl, or the command sign on a Mac. */
  keys: readonly string[];
  /** Key under `Shortcuts.items` in the messages. */
  labelKey: string;
  group: ShortcutGroup;
}

/**
 * Screens reached with Alt and a digit. The sidebar reads `digit` for its
 * hints, the key handler for where to go, the cheat sheet for the list.
 */
export interface GoTarget {
  digit: string;
  href: string;
  labelKey: string;
  /** Only someone signed in has this screen. */
  requiresAuth?: boolean;
  /** Starting a new translation clears whatever the last one left behind. */
  startsNew?: boolean;
}

export const GO_TARGETS: readonly GoTarget[] = [
  { digit: "1", href: "/text", labelKey: "goText", startsNew: true },
  { digit: "2", href: "/document", labelKey: "goDocument", startsNew: true },
  { digit: "3", href: "/passport", labelKey: "goPassport", requiresAuth: true },
  { digit: "4", href: "/projects", labelKey: "goProjects", requiresAuth: true },
  { digit: "5", href: "/profile", labelKey: "goProfile", requiresAuth: true },
  { digit: "6", href: "/orders", labelKey: "goOrders", requiresAuth: true },
];

/**
 * What the cheat sheet lists besides the Alt+digit screens. The keys are
 * handled in `ShortcutsProvider`; letters are matched on the physical key so
 * they work with the Georgian layout active.
 */
export const SHORTCUTS: readonly ShortcutInfo[] = [
  { id: "translate", keys: ["mod", "Enter"], labelKey: "translate", group: "translation" },
  { id: "translateShift", keys: ["Shift", "Enter"], labelKey: "translate", group: "translation" },
  { id: "focusInput", keys: ["/"], labelKey: "focusInput", group: "translation" },
  { id: "targetLanguage", keys: ["Alt", "L"], labelKey: "targetLanguage", group: "translation" },
  { id: "swap", keys: ["Alt", "S"], labelKey: "swap", group: "translation" },
  { id: "copy", keys: ["Alt", "Shift", "C"], labelKey: "copy", group: "translation" },
  { id: "download", keys: ["Alt", "Shift", "D"], labelKey: "download", group: "translation" },
  { id: "help", keys: ["?"], labelKey: "help", group: "general" },
  { id: "close", keys: ["Esc"], labelKey: "close", group: "general" },
];
