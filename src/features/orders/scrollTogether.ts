"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewScroller } from "@/features/translation/components/DocumentPreview";

/** How far down a box is scrolled: 0 at its top, 1 at its end. */
function progressOf(box: Element): number {
  const room = box.scrollHeight - box.clientHeight;
  return room > 0 ? box.scrollTop / room : 0;
}

/**
 * Two previews that scroll as one: moving either brings the other to the same
 * share of its own length.
 *
 * An original and its translation are rarely the same length, so the match is
 * by proportion, and within a long document it drifts. For that, moving
 * together can be switched off, the two lined up by hand, and switched on
 * again: from then on they keep the distance they were given.
 */
export function useScrollTogether() {
  const [together, setTogether] = useState(true);
  const [first, setFirst] = useState<PreviewScroller | null>(null);
  const [second, setSecond] = useState<PreviewScroller | null>(null);
  // How much further along the second stands than the first, as a share.
  const lead = useRef(0);

  // A preview that has just come up starts level with the other one.
  const reportFirst = useCallback((scroller: PreviewScroller | null) => {
    lead.current = 0;
    setFirst(scroller);
  }, []);
  const reportSecond = useCallback((scroller: PreviewScroller | null) => {
    lead.current = 0;
    setSecond(scroller);
  }, []);

  useEffect(() => {
    if (!together || !first || !second) return;

    // Positions set from here. Each sends a scroll event of its own, which is
    // an echo and not someone scrolling: it must not be passed back.
    const echoes = new Map<Element, number>();

    const follow = (from: PreviewScroller, to: PreviewScroller, sign: 1 | -1) => () => {
      const echo = echoes.get(from.box);
      if (echo !== undefined) {
        echoes.delete(from.box);
        if (Math.abs(from.box.scrollTop - echo) <= 1) return;
      }
      const room = to.box.scrollHeight - to.box.clientHeight;
      // Nothing to scroll there: shorter than its box, or not on screen.
      if (room <= 0) return;
      const share = Math.min(1, Math.max(0, progressOf(from.box) + sign * lead.current));
      const before = to.box.scrollTop;
      to.box.scrollTop = share * room;
      // Only a position that changed has an event coming.
      if (to.box.scrollTop !== before) echoes.set(to.box, to.box.scrollTop);
    };

    const onFirst = follow(first, second, 1);
    const onSecond = follow(second, first, -1);
    first.events.addEventListener("scroll", onFirst, { passive: true });
    second.events.addEventListener("scroll", onSecond, { passive: true });
    return () => {
      first.events.removeEventListener("scroll", onFirst);
      second.events.removeEventListener("scroll", onSecond);
    };
  }, [together, first, second]);

  const toggle = useCallback(() => {
    // Switched back on: the two keep the distance they stand at now.
    if (!together && first && second) {
      lead.current = progressOf(second.box) - progressOf(first.box);
    }
    setTogether(!together);
  }, [together, first, second]);

  return { together, toggle, reportFirst, reportSecond };
}
