"use client";

import { useEffect } from "react";

/**
 * Reveals `[data-reveal]` elements inside `#top` the first time they scroll into
 * view: a short fade and rise, staggered by an optional `--reveal-delay`.
 *
 * Progressive on purpose. Nothing is hidden until this has run and marked the
 * page `data-reveal-ready`, so the server HTML (crawlers, no-JS visitors) shows
 * everything, and people who ask for reduced motion never get the effect.
 * Anything already on screen or above it when the page loads is shown at once,
 * so a reload halfway down never leaves blank sections behind the reader.
 *
 * State lives in data attributes rather than classes, which React never
 * rewrites when a demo inside re-renders.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.getElementById("top");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const pending = elements.filter((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.dataset.revealed = "";
        return false;
      }
      return true;
    });
    root.dataset.revealReady = "";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
