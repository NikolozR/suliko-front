"use client";

import LandingHeader from "@/shared/components/LandingHeader";
import HeroSection from "@/shared/components/HeroSection";
import AboutSection from "@/shared/components/AboutSection";
import PricingSection from "@/shared/components/PricingSection";
import VideoSection from "@/shared/components/VideoSection";
import TestimonialsSection from "@/shared/components/TestimonialsSection";
import LandingFooter from "@/shared/components/LandingFooter";
import ScrollToTop from "@/shared/components/ScrollToTop";
import SulikoParticles from "@/shared/components/SulikoParticles";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background particles */}
      <SulikoParticles
        className="fixed inset-0 z-0"
        fullScreen={true}
        particleCount={60}
        speed={0.5}
        enableInteractions={true}
      />
      
      {/* Main content */}
      <div className="relative z-10">
        <LandingHeader />
        <main>
          <HeroSection />
          <AboutSection />
          <PricingSection />
          <VideoSection />
          <TestimonialsSection />
        </main>
        <LandingFooter />
        <ScrollToTop />
      </div>
    </div>
  );
}