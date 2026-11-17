"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + slides a section into place the first time it crosses into view. Plain
 * IntersectionObserver, no animation library — content is visible by default so it
 * is never hidden if JS is slow, only ever revealed, never the other way round.
 */
export default function MerchantReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-merchant-reveal
      className={`transition-[opacity,transform] duration-700 ease-out will-change-transform ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
