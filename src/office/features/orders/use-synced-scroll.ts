// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useCallback, useEffect, useState } from "react";

/** Remembered between visits: someone who turned it off wants it off. */
const PREFERENCE_KEY = "suliko.translation.syncScroll";

/**
 * Whether the two sides scroll together. On until someone turns it off.
 *
 * Read after mount, so the server's page and the first paint agree; storage
 * can be blocked or full, and then the choice lasts as long as the page does.
 */
export function useSyncPreference(): readonly [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(PREFERENCE_KEY) === "off") setOn(false);
    } catch {
      // Blocked storage: stay on.
    }
  }, []);

  const choose = useCallback((value: boolean) => {
    setOn(value);
    try {
      window.localStorage.setItem(PREFERENCE_KEY, value ? "on" : "off");
    } catch {
      // The choice holds for this page only.
    }
  }, []);

  return [on, choose] as const;
}

/** How long after moving a side the scroll events that move causes are ignored. */
const ECHO_MS = 100;

/**
 * Keeps two scrolling things at the same place, by how far down each is.
 *
 * The original and its translation are not the same length (a scan, a
 * Word-sized page), so "the same pixel" would drift at once; "the same
 * fraction of the way down" stays near, and lands on the same part of the
 * document for most. The side that is being scrolled by hand leads, and the
 * other follows. Moving the follower raises a scroll event of its own, which
 * must not move the leader back: events within a moment of a move are the
 * move's echo and are ignored.
 *
 * `original` is the element that scrolls the original (a PDF's pages, an
 * image), `translation` the one that scrolls the editor's pages. Either may
 * not exist yet, or ever (a PDF shown by the browser's own viewer cannot be
 * read), and then there is nothing to keep in step.
 */
export function useSyncedScroll(
  enabled: boolean,
  original: HTMLElement | null,
  translation: HTMLElement | null,
): void {
  useEffect(() => {
    if (!enabled || !original || !translation) return;

    const echo = { original: 0, translation: 0 };
    const reach = (element: HTMLElement) => Math.max(0, element.scrollHeight - element.clientHeight);

    const follow = (
      from: HTMLElement,
      to: HTMLElement,
      side: keyof typeof echo,
      other: keyof typeof echo,
    ) => {
      return () => {
        if (performance.now() < echo[side]) return;
        const distance = reach(from);
        const target = Math.round((distance > 0 ? from.scrollTop / distance : 0) * reach(to));
        if (Math.abs(to.scrollTop - target) < 1) return;
        echo[other] = performance.now() + ECHO_MS;
        to.scrollTop = target;
      };
    };

    const fromOriginal = follow(original, translation, "original", "translation");
    const fromTranslation = follow(translation, original, "translation", "original");
    original.addEventListener("scroll", fromOriginal, { passive: true });
    translation.addEventListener("scroll", fromTranslation, { passive: true });
    // Turned on part way down: bring the translation to where the original is.
    fromOriginal();

    return () => {
      original.removeEventListener("scroll", fromOriginal);
      translation.removeEventListener("scroll", fromTranslation);
    };
  }, [enabled, original, translation]);
}
