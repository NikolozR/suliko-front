"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LandingHeader from "@/shared/components/LandingHeader";
import HeroSection from "@/shared/components/HeroSection";
import ScrollToTop from "@/shared/components/ScrollToTop";
import LandingSectionSkeleton from "@/shared/components/landing/LandingSectionSkeleton";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

const AboutSection = dynamic(() => import("@/shared/components/AboutSection"), {
  loading: () => <LandingSectionSkeleton />,
});
const PricingSection = dynamic(() => import("@/shared/components/PricingSection"), {
  loading: () => <LandingSectionSkeleton withCards />,
});
const VideoSection = dynamic(() => import("@/shared/components/VideoSection"), {
  loading: () => <LandingSectionSkeleton />,
});
const TestimonialsSection = dynamic(() => import("@/shared/components/TestimonialsSection"), {
  loading: () => <LandingSectionSkeleton withCards />,
});
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
const SulikoParticles = dynamic(() => import("@/shared/components/SulikoParticles"), {
  ssr: false,
});

export default function LandingPage() {
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  useEffect(() => {
    let mounted = true;
    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => {
            if (mounted) {
              setShowDeferredSections(true);
            }
          }, { timeout: 1200 })
        : window.setTimeout(() => {
            if (mounted) {
              setShowDeferredSections(true);
            }
          }, 350);

    return () => {
      mounted = false;
      if ("cancelIdleCallback" in window && typeof idleCallback === "number") {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback as number);
      }
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Background particles */}
      <SulikoParticles
        className="fixed inset-0 z-0"
        fullScreen
        particleCount={60}
        speed={0.5}
        enableInteractions={false}
      />
      
      {/* Main content */}
      <div className="relative z-10">
        <LandingHeader />
        <main>
          <HeroSection />
          {showDeferredSections ? (
            <>
              <AboutSection />
              <PricingSection />
              <VideoSection />
              <TestimonialsSection />
            </>
          ) : (
            <>
              <LandingSectionSkeleton />
              <LandingSectionSkeleton withCards />
            </>
          )}
        </main>
        {showDeferredSections ? (
          <LandingFooter />
        ) : (
          <div className="border-t border-border bg-muted/30 px-4 py-10">
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

