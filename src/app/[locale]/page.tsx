"use client";

import { useEffect } from "react";
import LandingHeader from "@/shared/components/LandingHeader";
import HeroSection from "@/shared/components/HeroSection";
import AboutSection from "@/shared/components/AboutSection";
import PricingSection from "@/shared/components/PricingSection";
import TestimonialsSection from "@/shared/components/TestimonialsSection";
import LandingFooter from "@/shared/components/LandingFooter";
import ScrollToTop from "@/shared/components/ScrollToTop";

export default function LandingPage() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    };

    // Add smooth scroll behavior to all anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    // Cleanup
    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <LandingFooter />
      <ScrollToTop />
    </div>
  );
}


