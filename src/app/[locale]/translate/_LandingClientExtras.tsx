"use client";

import dynamic from "next/dynamic";
import ScrollReveal from "@/shared/components/ScrollReveal";
import ScrollToTop from "@/shared/components/ScrollToTop";

// Needs the browser (timers, local storage), so it skips server rendering.
const BookDemoBubble = dynamic(() => import("@/shared/components/BookDemoBubble"), {
  ssr: false,
});

/** The landing page's client-only helpers: reveal on scroll, back to top, demo bubble. */
export default function LandingClientExtras() {
  return (
    <>
      <ScrollReveal />
      <ScrollToTop />
      <BookDemoBubble />
    </>
  );
}
