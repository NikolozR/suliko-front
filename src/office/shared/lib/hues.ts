// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The hue palette: categorical colour for modules and statuses.
 *
 * The values live in globals.css (`--hue-*-tint` / `--hue-*-ink`), checked
 * for contrast in both themes. What a hue MEANS is decided where the thing
 * is defined: a status in `statuses.ts`, a module in `navigation.ts`.
 */
export type Hue = "blue" | "teal" | "violet" | "plum" | "amber" | "yellow" | "green" | "red" | "grey";

/**
 * Literal class strings so Tailwind keeps them.
 *
 *   tint   the soft fill                    ink   text and icons on it
 *   soft   the two together: a soft pill    dot   the ink as a fill
 *   solid  the saturated pill: the ink as the fill under white text, dark
 *          text in the dark theme, where the inks are light. White is
 *          5.47:1 or better on every light ink (teal the lowest), the dark
 *          text 7.16:1 or better on every dark one (red the lowest).
 */
export const HUE_CLASSES: Record<
  Hue,
  { tint: string; ink: string; soft: string; dot: string; solid: string }
> = {
  blue: {
    tint: "bg-hue-blue-tint",
    ink: "text-hue-blue-ink",
    soft: "bg-hue-blue-tint text-hue-blue-ink",
    dot: "bg-hue-blue-ink",
    solid: "bg-hue-blue-ink text-white dark:text-neutral-950",
  },
  teal: {
    tint: "bg-hue-teal-tint",
    ink: "text-hue-teal-ink",
    soft: "bg-hue-teal-tint text-hue-teal-ink",
    dot: "bg-hue-teal-ink",
    solid: "bg-hue-teal-ink text-white dark:text-neutral-950",
  },
  violet: {
    tint: "bg-hue-violet-tint",
    ink: "text-hue-violet-ink",
    soft: "bg-hue-violet-tint text-hue-violet-ink",
    dot: "bg-hue-violet-ink",
    solid: "bg-hue-violet-ink text-white dark:text-neutral-950",
  },
  plum: {
    tint: "bg-hue-plum-tint",
    ink: "text-hue-plum-ink",
    soft: "bg-hue-plum-tint text-hue-plum-ink",
    dot: "bg-hue-plum-ink",
    solid: "bg-hue-plum-ink text-white dark:text-neutral-950",
  },
  amber: {
    tint: "bg-hue-amber-tint",
    ink: "text-hue-amber-ink",
    soft: "bg-hue-amber-tint text-hue-amber-ink",
    dot: "bg-hue-amber-ink",
    solid: "bg-hue-amber-ink text-white dark:text-neutral-950",
  },
  yellow: {
    tint: "bg-hue-yellow-tint",
    ink: "text-hue-yellow-ink",
    soft: "bg-hue-yellow-tint text-hue-yellow-ink",
    dot: "bg-hue-yellow-ink",
    solid: "bg-hue-yellow-ink text-white dark:text-neutral-950",
  },
  green: {
    tint: "bg-hue-green-tint",
    ink: "text-hue-green-ink",
    soft: "bg-hue-green-tint text-hue-green-ink",
    dot: "bg-hue-green-ink",
    solid: "bg-hue-green-ink text-white dark:text-neutral-950",
  },
  red: {
    tint: "bg-hue-red-tint",
    ink: "text-hue-red-ink",
    soft: "bg-hue-red-tint text-hue-red-ink",
    dot: "bg-hue-red-ink",
    solid: "bg-hue-red-ink text-white dark:text-neutral-950",
  },
  grey: {
    tint: "bg-hue-grey-tint",
    ink: "text-hue-grey-ink",
    soft: "bg-hue-grey-tint text-hue-grey-ink",
    dot: "bg-hue-grey-ink",
    solid: "bg-hue-grey-ink text-white dark:text-neutral-950",
  },
};
