"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "next-themes";

export default function HeroSection() {
  const t = useTranslations("Landing");
  const [mounted, setMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { resolvedTheme } = useTheme();


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Try to programmatically start playback when ready
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => {
      // Some browsers require an explicit play() call even when muted
      v.play().catch((err) => console.log("Video play failed:", err));
    };
    const onError = (e: Event) => {
      console.error("Video error:", e);
      setVideoError(true);
    };
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
    };
  }, [mounted]);

  // Theme-aware star colors
  const isDark = mounted && resolvedTheme === "dark";
  const starColor = isDark ? "white" : "#1e40af"; // Blue for light theme, white for dark
  const shootingStarColor = isDark ? "from-white via-blue-200" : "from-blue-600 via-blue-400";

  // Generate stable star positions using useMemo to avoid hydration mismatches
  const starData = useMemo(() => {
    if (!mounted) return { stars: [], mediumStars: [], smallStars: [], shootingStars: [] };
    
    const generateStars = (count: number, size: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 4,
        animationDuration: 2 + Math.random() * 3,
        opacity: size === 1 ? 0.3 + Math.random() * 0.4 : undefined,
      }));
    };

    return {
      stars: generateStars(40, 1), // Large stars
      mediumStars: generateStars(60, 0.5), // Medium stars
      smallStars: generateStars(100, 0), // Small stars
      shootingStars: Array.from({ length: 2 }, (_, i) => ({
        id: i,
        left: Math.random() * 20,
        top: Math.random() * 20,
        animationDelay: Math.random() * 10,
        animationDuration: 2 + Math.random() * 2,
      })),
    };
  }, [mounted]);

  return (
    <section className="relative h-[93.5vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />
      
      {/* Star Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars Layer 1 - Large twinkling stars */}
        <div className="absolute inset-0">
          {starData.stars.map((star) => (
            <div
              key={`star-1-${star.id}`}
              className="absolute w-1 h-1 rounded-full animate-twinkle"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
              }}
            />
          ))}
        </div>

        {/* Stars Layer 2 - Medium stars */}
        <div className="absolute inset-0">
          {starData.mediumStars.map((star) => (
            <div
              key={`star-2-${star.id}`}
              className="absolute w-0.5 h-0.5 rounded-full animate-slow-twinkle"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay + 1}s`,
                animationDuration: `${star.animationDuration + 1}s`,
              }}
            />
          ))}
        </div>

        {/* Stars Layer 3 - Small static stars */}
        <div className="absolute inset-0">
          {starData.smallStars.map((star) => (
            <div
              key={`star-3-${star.id}`}
              className="absolute w-px h-px rounded-full"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>

        {/* Shooting stars */}
        <div className="absolute inset-0">
          {starData.shootingStars.map((star) => (
            <div
              key={`shooting-${star.id}`}
              className={`absolute w-24 h-px bg-gradient-to-r ${shootingStarColor} to-transparent animate-shooting-star`}
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-12 sm:px-16 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          {/* Left column: text */}
          <div className="lg:col-span-2">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-4 leading-tight text-center lg:text-left">
              {t("title")}
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
              {t("description")}
            </p>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              <Link href="/document">
                <Button size="lg" className="px-6 py-3 text-base group">
                  {t("cta")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="px-6 py-3 text-base">
                  {t("viewPricing")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column: video mockup */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <div className="relative w-full" style={{ maxWidth: '600px' }}>
              {videoError ? (
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center">
                  <p className="text-gray-500">Video failed to load</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onError={() => setVideoError(true)}
                >
                  <source src="/api/hero-video" type="video/mp4" />
                  <source src="/Video1.mp4" type="video/mp4" />
                  <source src="/videos/Video1.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
