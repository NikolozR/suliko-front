"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __sulikoRouteTiming?: {
      from: string;
      to: string;
      startedAt: number;
    };
  }
}

export default function RouteTransitionProgress() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const pendingPathRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const startProgress = (toPath: string) => {
      if (!toPath || toPath === pathname || toPath.startsWith("#")) return;
      pendingPathRef.current = toPath;
      setIsVisible(true);
      setWidth(20);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setWidth((prev) => Math.min(90, prev + Math.max(2, (100 - prev) * 0.08)));
      }, 120);
      window.__sulikoRouteTiming = {
        from: pathname,
        to: toPath,
        startedAt: performance.now(),
      };
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/")) {
        startProgress(href.split("#")[0] || href);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (!pendingPathRef.current) return;
    setWidth(100);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      setWidth(0);
      pendingPathRef.current = null;
    }, 260);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-0 top-0 z-[120] h-0.5 bg-suliko-default-color transition-[width,opacity] duration-200 ease-out"
      style={{ width: `${width}%` }}
      role="progressbar"
      aria-label="Route transition loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    />
  );
}
