import type { CSSProperties } from "react";

/**
 * Sections the header links to, in page order. Each id is also the section's
 * #anchor, so a link like /tms#reports can be shared.
 */
export const NAV_SECTIONS = ["pricing", "journey", "finance", "reports", "faq"] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

/** Lands a linked section's heading just below the sticky header. */
export const SECTION_ANCHOR = "scroll-mt-24";

/** Staggers a `data-reveal` element's entrance (see ScrollReveal). */
export const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;
