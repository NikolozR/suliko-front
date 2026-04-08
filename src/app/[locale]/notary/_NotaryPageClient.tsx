"use client";

import dynamic from "next/dynamic";
import NotaryHeader from "@/shared/components/NotaryHeader";
import NotaryHeroSection from "@/shared/components/notary/NotaryHeroSection";
import ScrollToTop from "@/shared/components/ScrollToTop";
import LandingSectionSkeleton from "@/shared/components/landing/LandingSectionSkeleton";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useEffect, useState } from "react";

const NotaryHowItWorksSection = dynamic(
  () => import("@/shared/components/notary/NotaryHowItWorksSection"),
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

  return (
    <div className="min-h-screen">
      <div style={{ position: "relative", zIndex: 1 }}>
        <NotaryHeader />
        <main>
          <NotaryHeroSection />
          {showDeferredSections ? (
            <>
              <NotaryHowItWorksSection />
              <NotaryPricingSection />
              <NotaryFAQSection />
              <NotaryContactSection />
            </>
          ) : (
            <>
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
      </div>
    </div>
  );
}
