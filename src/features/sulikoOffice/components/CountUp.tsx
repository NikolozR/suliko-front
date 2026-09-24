"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up from zero the first time it scrolls into view.
 *
 * The server renders the final value, so crawlers, no-JS visitors and anyone
 * who asks for reduced motion simply see the real figure. On the client it is
 * reset to zero only while still off screen, so nothing visibly jumps.
 */
export default function CountUp({
  value,
  locale,
  suffix = "",
  durationMs = 1400,
}: {
  value: number;
  locale: string;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already visible: leave it be
    setShown(0);

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(Math.round(value * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatCount(shown, locale)}
      {suffix}
    </span>
  );
}

/** Georgian leaves four-digit numbers ungrouped (1030); English groups them (1,030). */
function formatCount(n: number, locale: string): string {
  return locale === "ka" ? String(n) : n.toLocaleString("en-US");
}
