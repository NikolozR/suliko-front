"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import NotaryHeader from "@/shared/components/NotaryHeader";
import NotaryHeroSection from "@/shared/components/notary/NotaryHeroSection";
import NotaryMobileStickyBar from "@/shared/components/notary/NotaryMobileStickyBar";
import ScrollToTop from "@/shared/components/ScrollToTop";
import LandingSectionSkeleton from "@/shared/components/landing/LandingSectionSkeleton";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

const NotaryQuotePathsSection = dynamic(
  () => import("@/shared/components/notary/NotaryQuotePathsSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryCalculatorSection = dynamic(
  () => import("@/shared/components/notary/NotaryCalculatorSection"),
  { loading: () => <LandingSectionSkeleton minHeight={400} /> }
);

const NotaryHowItWorksSection = dynamic(
  () => import("@/shared/components/notary/NotaryHowItWorksSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryTestimonialsSection = dynamic(
  () => import("@/shared/components/notary/NotaryTestimonialsSection"),
  { loading: () => <LandingSectionSkeleton withCards /> }
);

const NotaryAboutSection = dynamic(
  () => import("@/shared/components/notary/NotaryAboutSection"),
  { loading: () => <LandingSectionSkeleton /> }
);

const NotaryPricingSection = dynamic(
  () => import("@/shared/components/notary/NotaryPricingSection"),
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

const NotaryLeadCapturePopup = dynamic(
  () => import("@/shared/components/notary/NotaryLeadCapturePopup"),
  { ssr: false }
);

const LandingFooter = dynamic(
  () => import("@/shared/components/LandingFooter"),
  {
    loading: () => (
      <div className="border-t border-border bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
      </div>
    ),
  }
);

export default function NotaryPageClient() {
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const surveyDismissed = useRef(false);
  const heroRef = useRef<HTMLElement>(null);

  // Deferred sections: load after first idle moment
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

  // Survey popup: show after 3 s if not yet dismissed
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!surveyDismissed.current) setShowSurvey(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSurveyClose = () => {
    surveyDismissed.current = true;
    setShowSurvey(false);
  };

  return (
    <div className="min-h-screen">
      <div style={{ position: "relative", zIndex: 1 }}>
        <NotaryHeader />
        <main>
          {/* 1. Hero */}
          <NotaryHeroSection ref={heroRef} />

          {showDeferredSections ? (
            <>
              {/* 2. Quote Paths — 3 ways to get a price */}
              <NotaryQuotePathsSection />

              {/* 3. Tabbed: Price Calculator + File Upload */}
              <NotaryCalculatorSection />

              {/* 3. How It Works */}
              <NotaryHowItWorksSection />

              {/* 4. Testimonials */}
              <NotaryTestimonialsSection />

              {/* 5. About */}
              <NotaryAboutSection />

              {/* 6. Prices */}
              <NotaryPricingSection />

              {/* 7. FAQ */}
              <NotaryFAQSection />

              {/* 8. Contact */}
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

        {/* Mobile sticky CTA bar — shows after hero scrolls out of view */}
        <NotaryMobileStickyBar heroRef={heroRef} />

        {/* Survey modal — auto-shows after 3 s, SSR-skipped */}
        <NotaryLeadCapturePopup isOpen={showSurvey} onClose={handleSurveyClose} />
      </div>
    </div>
  );
}
