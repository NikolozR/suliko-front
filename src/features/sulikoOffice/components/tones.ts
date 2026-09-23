/**
 * Colour roles for the Suliko Office landing page.
 *
 * The page follows the product UI's pastel card tints, but the site defaults to
 * the dark theme, so every tint carries its dark counterpart here instead of
 * being scattered as one-off hex values across the sections.
 */

export const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Small blue label above a section heading. Lightened in dark mode for contrast. */
export const KICKER = "text-[15px] tracking-[0.3px] text-suliko-default-color dark:text-[#8fa2ff]";

export const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2.5 rounded-xl bg-suliko-default-color text-white transition-colors hover:bg-suliko-default-hover-color focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-suliko-default-color";

export const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-[#eef1fe] dark:hover:bg-white/5";

/** Tinted surfaces behind a band of the page. */
export const ALT_SECTION = "border-y border-border bg-[#f6f8fd] dark:bg-white/[0.03]";

export type Tone = "blue" | "amber" | "green";

export const TONES: Record<Tone, { card: string; icon: string; body: string; tag: string }> = {
  blue: {
    card: "bg-[#eef1fe] dark:bg-[#3b59f3]/15",
    icon: "text-suliko-default-color dark:text-[#aebcff]",
    body: "text-[#3a4466] dark:text-slate-300",
    tag: "bg-white text-[#2a44c9] dark:bg-white/10 dark:text-[#c3ceff]",
  },
  amber: {
    card: "bg-[#fff4d9] dark:bg-amber-400/10",
    icon: "text-[#9a6400] dark:text-amber-300",
    body: "text-[#4a3f22] dark:text-slate-300",
    tag: "bg-white text-[#6b4a00] dark:bg-white/10 dark:text-amber-200",
  },
  green: {
    card: "bg-[#e7f6ec] dark:bg-emerald-400/10",
    icon: "text-[#1e7440] dark:text-emerald-300",
    body: "text-[#28453a] dark:text-slate-300",
    tag: "bg-white text-[#1e7440] dark:bg-white/10 dark:text-emerald-200",
  },
};

/** Order-status chips, matching the tones the product uses for each status. */
export type StatusKey = "nw" | "paid" | "translator" | "correcting" | "notary" | "ready" | "done";

export const STATUS_CHIP: Record<StatusKey, string> = {
  nw: "bg-[#eef0f4] text-[#3e4760] dark:bg-white/10 dark:text-slate-200",
  paid: "bg-[#e7f6ec] text-[#1e7440] dark:bg-emerald-400/15 dark:text-emerald-300",
  translator: "bg-[#eef1fe] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]",
  correcting: "bg-[#fff4d9] text-[#7a4f00] dark:bg-amber-400/15 dark:text-amber-200",
  notary: "bg-[#dfe5fe] text-[#1d33a8] dark:bg-indigo-400/20 dark:text-indigo-200",
  ready: "bg-[#e7f6ec] text-[#1e7440] dark:bg-emerald-400/15 dark:text-emerald-300",
  done: "bg-[#11289c] text-white dark:bg-suliko-default-color",
};

export const STATUS_ORDER: StatusKey[] = ["nw", "paid", "translator", "correcting", "notary", "ready", "done"];
