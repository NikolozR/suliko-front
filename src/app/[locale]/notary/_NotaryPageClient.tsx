"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import NotaryHeader from "@/shared/components/NotaryHeader";
import NotaryHeroSection from "@/shared/components/notary/NotaryHeroSection";
import NotaryTrustStrip from "@/shared/components/notary/NotaryTrustStrip";
import NotaryMobileStickyBar from "@/shared/components/notary/NotaryMobileStickyBar";
import ScrollToTop from "@/shared/components/ScrollToTop";
import LandingSectionSkeleton from "@/shared/components/landing/LandingSectionSkeleton";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import type { BlogPost } from "@/lib/blog-types";

const NotaryQuotePathsSection = dynamic(
  () => import("@/shared/components/notary/NotaryQuotePathsSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryCalculatorSection = dynamic(
  () => import("@/shared/components/notary/NotaryCalculatorSection"),
  { loading: () => <LandingSectionSkeleton minHeight={400} /> }
);

const NotaryTestimonialsSection = dynamic(
  () => import("@/shared/components/notary/NotaryTestimonialsSection"),
  { loading: () => <LandingSectionSkeleton withCards /> }
);

const NotaryHowItWorksSection = dynamic(
  () => import("@/shared/components/notary/NotaryHowItWorksSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryAboutSection = dynamic(
  () => import("@/shared/components/notary/NotaryAboutSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryPricingSection = dynamic(
  () => import("@/shared/components/notary/NotaryPricingSection"),
  { loading: () => <LandingSectionSkeleton withCards /> }
);

const NotaryBlogStrip = dynamic(
  () => import("@/shared/components/notary/NotaryBlogStrip"),
  { loading: () => <LandingSectionSkeleton withCards /> }
);

const NotaryFAQSection = dynamic(
  () => import("@/shared/components/notary/NotaryFAQSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryContactSection = dynamic(
  () => import("@/shared/components/notary/NotaryContactSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryFloatingChannels = dynamic(
  () => import("@/shared/components/notary/NotaryFloatingChannels"),
  { ssr: false }
);

const NotaryLeadCapturePopup = dynamic(
  () => import("@/shared/components/notary/NotaryLeadCapturePopup"),
  { ssr: false }
);

const LandingFooter = dynamic(() => import("@/shared/components/LandingFooter"), {
  loading: () => (
    <div className="border-t border-border bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
    </div>
  ),
});

interface Props {
  posts: BlogPost[];
}

/**
 * The notary landing page — section order per handoff §4.
 *
 * The money is the tabbed panel at `#calculator`: tab 1 quotes instantly and
 * captures no lead, tab 2 is the order wizard and the real conversion.
 */
export default function NotaryPageClient({ posts }: Props) {
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const popupDismissed = useRef(false);
  const heroRef = useRef<HTMLElement>(null);

  // Everything below the fold loads at the first idle moment.
  useEffect(() => {
    let mounted = true;
    let idleCallbackId: number | null = null;
    let timeoutId: number | null = null;

    const onReady = () => {
      if (mounted) setShowDeferredSections(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(onReady, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(onReady, 350);
    }

    return () => {
      mounted = false;
      if (idleCallbackId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  // Lead popup: 3 s after load, on every page load — no frequency cap (§9).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!popupDismissed.current) setShowPopup(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const handlePopupClose = () => {
    popupDismissed.current = true;
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen">
      <div style={{ position: "relative", zIndex: 1 }}>
        <NotaryHeader />

        <main>
          {/* 1. Hero */}
          <NotaryHeroSection ref={heroRef} />

          {/* 2. Trust strip */}
          <NotaryTrustStrip />

          {showDeferredSections ? (
            <>
              {/* 3. The three ways to get a price */}
              <NotaryQuotePathsSection />

              {/* 4. #calculator — Price Calculator | Place an Order */}
              <NotaryCalculatorSection />

              {/* 5. Testimonials */}
              <NotaryTestimonialsSection />

              {/* 6. How it works */}
              <NotaryHowItWorksSection />

              {/* 7. About */}
              <NotaryAboutSection />

              {/* 8. Prices */}
              <NotaryPricingSection />

              {/* 9. Blog strip */}
              <NotaryBlogStrip posts={posts} />

              {/* 10. FAQ */}
              <NotaryFAQSection />

              {/* 11. Contact */}
              <NotaryContactSection />
            </>
          ) : (
            <>
              <LandingSectionSkeleton minHeight={400} />
              <LandingSectionSkeleton minHeight={300} />
              <LandingSectionSkeleton withCards minHeight={500} />
              <LandingSectionSkeleton minHeight={400} />
              <LandingSectionSkeleton withCards minHeight={600} />
            </>
          )}
        </main>

        {showDeferredSections ? (
          <LandingFooter />
        ) : (
          <div
            className="border-t border-border bg-muted/30 px-4 py-10"
            style={{ minHeight: 300 }}
          >
            <div className="mx-auto max-w-6xl space-y-4">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-5 w-80 max-w-full" />
            </div>
          </div>
        )}

        <ScrollToTop />

        {/* Floating channels + mobile sticky bar */}
        <NotaryFloatingChannels />
        <NotaryMobileStickyBar heroRef={heroRef} />

        {/* Lead popup — auto-shows after 3 s, SSR-skipped */}
        <NotaryLeadCapturePopup isOpen={showPopup} onClose={handlePopupClose} />
      </div>
    </div>
  );
}
