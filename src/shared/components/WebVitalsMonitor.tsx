"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type RouteTimingMark = {
  from: string;
  to: string;
  startedAt: number;
};

declare global {
  interface Window {
    __sulikoRouteTiming?: RouteTimingMark;
  }
}

export default function WebVitalsMonitor() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[WebVitals]", metric.name, metric.value, metric.rating);
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeTiming = window.__sulikoRouteTiming;
    if (!activeTiming || activeTiming.to !== pathname) return;

    const duration = Math.max(0, performance.now() - activeTiming.startedAt);
    if (process.env.NODE_ENV !== "production") {
      console.info("[RouteTiming]", `${activeTiming.from} -> ${activeTiming.to}`, Math.round(duration), "ms");
    }
    window.__sulikoRouteTiming = undefined;
  }, [pathname]);

  return null;
}
