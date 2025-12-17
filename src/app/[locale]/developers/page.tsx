"use client";

import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";
import ScrollToTop from "@/shared/components/ScrollToTop";
import SulikoParticles from "@/shared/components/SulikoParticles";
import DevelopersPageClient from "@/features/developers/components/DevelopersPageClient";

export default function DevelopersPage() {
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
          <DevelopersPageClient />
        </main>
        <LandingFooter />
        <ScrollToTop />
      </div>
    </div>
  );
}

