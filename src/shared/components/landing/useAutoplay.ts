"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether a landing loop should be running: its element is on screen, the tab
 * is visible, and the visitor hasn't asked for reduced motion.
 *
 * Put `ref` on the section and `data-paused={!running || undefined}` next to
 * it: CSS loops (the `lp-*` classes) freeze under `data-paused`, and timers
 * should only tick while `running` is true.
 */
export function useAutoplay<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return { ref, running: inView && pageVisible && !reducedMotion, reducedMotion };
}

/**
 * Calls `onTick` every `ms` while `running`; stops (keeping state) otherwise.
 * A new `resetKey` starts the interval over, e.g. after a manual pick.
 */
export function useTicker(running: boolean, ms: number, onTick: () => void, resetKey?: unknown) {
  const saved = useRef(onTick);
  useEffect(() => {
    saved.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [running, ms, resetKey]);
}
