"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { LoadingButton } from "@/features/ui/components/loading";

// Pre-generated fixed star positions — stable on SSR and client (no hydration mismatch)
const STAR_DATA = {
  stars: [
    { id: 0, left: 8.3, top: 12.1, animationDelay: 0.4, animationDuration: 3.1 },
    { id: 1, left: 19.7, top: 45.6, animationDelay: 1.2, animationDuration: 2.8 },
    { id: 2, left: 33.5, top: 7.9, animationDelay: 2.7, animationDuration: 4.2 },
    { id: 3, left: 47.2, top: 63.4, animationDelay: 0.9, animationDuration: 3.6 },
    { id: 4, left: 61.8, top: 28.3, animationDelay: 3.1, animationDuration: 2.5 },
    { id: 5, left: 74.1, top: 82.7, animationDelay: 1.8, animationDuration: 4.8 },
    { id: 6, left: 88.4, top: 51.2, animationDelay: 0.3, animationDuration: 3.3 },
    { id: 7, left: 5.6, top: 77.8, animationDelay: 2.4, animationDuration: 2.9 },
    { id: 8, left: 25.9, top: 34.5, animationDelay: 1.5, animationDuration: 4.1 },
    { id: 9, left: 42.7, top: 90.1, animationDelay: 3.8, animationDuration: 3.7 },
    { id: 10, left: 56.3, top: 18.6, animationDelay: 0.7, animationDuration: 2.6 },
    { id: 11, left: 69.4, top: 72.3, animationDelay: 2.1, animationDuration: 4.4 },
    { id: 12, left: 82.8, top: 39.7, animationDelay: 1.0, animationDuration: 3.9 },
    { id: 13, left: 14.2, top: 58.9, animationDelay: 3.5, animationDuration: 2.7 },
    { id: 14, left: 37.6, top: 24.2, animationDelay: 0.6, animationDuration: 4.6 },
    { id: 15, left: 51.9, top: 86.4, animationDelay: 2.9, animationDuration: 3.2 },
    { id: 16, left: 65.7, top: 10.8, animationDelay: 1.3, animationDuration: 4.9 },
    { id: 17, left: 79.2, top: 66.1, animationDelay: 3.7, animationDuration: 2.4 },
    { id: 18, left: 93.5, top: 43.7, animationDelay: 0.8, animationDuration: 3.8 },
    { id: 19, left: 11.4, top: 95.3, animationDelay: 2.2, animationDuration: 4.3 },
    { id: 20, left: 28.8, top: 5.4, animationDelay: 1.6, animationDuration: 3.5 },
    { id: 21, left: 44.1, top: 48.7, animationDelay: 3.3, animationDuration: 2.3 },
    { id: 22, left: 58.6, top: 31.9, animationDelay: 0.5, animationDuration: 4.7 },
    { id: 23, left: 72.3, top: 55.6, animationDelay: 1.9, animationDuration: 3.0 },
  ],
  mediumStars: [
    { id: 0, left: 3.4, top: 22.7, animationDelay: 1.1, animationDuration: 3.9 },
    { id: 1, left: 10.8, top: 68.4, animationDelay: 2.8, animationDuration: 5.1 },
    { id: 2, left: 17.2, top: 41.3, animationDelay: 0.4, animationDuration: 4.3 },
    { id: 3, left: 23.9, top: 85.6, animationDelay: 3.6, animationDuration: 3.7 },
    { id: 4, left: 30.1, top: 14.8, animationDelay: 1.7, animationDuration: 5.4 },
    { id: 5, left: 36.7, top: 53.2, animationDelay: 0.9, animationDuration: 4.8 },
    { id: 6, left: 43.5, top: 29.7, animationDelay: 2.3, animationDuration: 3.5 },
    { id: 7, left: 50.2, top: 74.1, animationDelay: 3.1, animationDuration: 5.2 },
    { id: 8, left: 57.8, top: 8.3, animationDelay: 0.6, animationDuration: 4.1 },
    { id: 9, left: 63.4, top: 47.9, animationDelay: 1.4, animationDuration: 3.6 },
    { id: 10, left: 70.6, top: 91.2, animationDelay: 2.7, animationDuration: 5.0 },
    { id: 11, left: 77.3, top: 35.6, animationDelay: 0.2, animationDuration: 4.6 },
    { id: 12, left: 84.1, top: 61.4, animationDelay: 3.4, animationDuration: 3.3 },
    { id: 13, left: 90.7, top: 19.8, animationDelay: 1.8, animationDuration: 5.3 },
    { id: 14, left: 6.9, top: 78.5, animationDelay: 0.7, animationDuration: 4.4 },
    { id: 15, left: 13.5, top: 33.1, animationDelay: 2.5, animationDuration: 3.8 },
    { id: 16, left: 20.4, top: 57.8, animationDelay: 3.9, animationDuration: 4.9 },
    { id: 17, left: 27.2, top: 96.3, animationDelay: 1.0, animationDuration: 3.4 },
    { id: 18, left: 34.8, top: 42.6, animationDelay: 2.1, animationDuration: 5.5 },
    { id: 19, left: 41.6, top: 17.4, animationDelay: 0.3, animationDuration: 4.2 },
    { id: 20, left: 48.3, top: 66.9, animationDelay: 3.2, animationDuration: 3.6 },
    { id: 21, left: 55.1, top: 83.7, animationDelay: 1.5, animationDuration: 5.1 },
    { id: 22, left: 61.9, top: 25.4, animationDelay: 0.8, animationDuration: 4.5 },
    { id: 23, left: 68.7, top: 50.8, animationDelay: 2.6, animationDuration: 3.2 },
    { id: 24, left: 75.4, top: 72.3, animationDelay: 3.7, animationDuration: 5.3 },
    { id: 25, left: 82.2, top: 11.6, animationDelay: 1.2, animationDuration: 4.0 },
    { id: 26, left: 88.9, top: 38.9, animationDelay: 0.5, animationDuration: 3.9 },
    { id: 27, left: 95.6, top: 87.4, animationDelay: 2.9, animationDuration: 5.2 },
    { id: 28, left: 2.1, top: 55.2, animationDelay: 1.6, animationDuration: 3.7 },
    { id: 29, left: 9.3, top: 3.8, animationDelay: 3.3, animationDuration: 4.7 },
    { id: 30, left: 16.1, top: 93.5, animationDelay: 0.1, animationDuration: 3.3 },
    { id: 31, left: 22.8, top: 27.3, animationDelay: 2.4, animationDuration: 5.0 },
    { id: 32, left: 29.6, top: 71.6, animationDelay: 1.3, animationDuration: 4.3 },
    { id: 33, left: 46.4, top: 6.2, animationDelay: 3.0, animationDuration: 3.8 },
    { id: 34, left: 52.7, top: 45.1, animationDelay: 0.4, animationDuration: 5.4 },
    { id: 35, left: 97.1, top: 62.7, animationDelay: 1.9, animationDuration: 4.1 },
  ],
  smallStars: [
    { id: 0, left: 1.8, top: 15.3, opacity: 0.6 }, { id: 1, left: 7.4, top: 38.7, opacity: 0.4 },
    { id: 2, left: 12.9, top: 61.2, opacity: 0.7 }, { id: 3, left: 18.6, top: 84.5, opacity: 0.5 },
    { id: 4, left: 24.3, top: 22.8, opacity: 0.6 }, { id: 5, left: 29.7, top: 46.1, opacity: 0.3 },
    { id: 6, left: 35.2, top: 69.4, opacity: 0.7 }, { id: 7, left: 40.8, top: 92.7, opacity: 0.5 },
    { id: 8, left: 46.5, top: 31.6, opacity: 0.4 }, { id: 9, left: 52.1, top: 54.9, opacity: 0.6 },
    { id: 10, left: 57.8, top: 78.2, opacity: 0.3 }, { id: 11, left: 63.4, top: 8.5, opacity: 0.7 },
    { id: 12, left: 69.1, top: 41.8, opacity: 0.5 }, { id: 13, left: 74.7, top: 65.1, opacity: 0.4 },
    { id: 14, left: 80.4, top: 88.4, opacity: 0.6 }, { id: 15, left: 86.1, top: 27.7, opacity: 0.3 },
    { id: 16, left: 91.7, top: 51.0, opacity: 0.7 }, { id: 17, left: 97.3, top: 74.3, opacity: 0.5 },
    { id: 18, left: 4.6, top: 97.6, opacity: 0.4 }, { id: 19, left: 10.2, top: 9.9, opacity: 0.6 },
    { id: 20, left: 15.9, top: 33.2, opacity: 0.3 }, { id: 21, left: 21.5, top: 56.5, opacity: 0.7 },
    { id: 22, left: 27.2, top: 79.8, opacity: 0.5 }, { id: 23, left: 32.8, top: 13.1, opacity: 0.4 },
    { id: 24, left: 38.5, top: 36.4, opacity: 0.6 }, { id: 25, left: 44.1, top: 59.7, opacity: 0.3 },
    { id: 26, left: 49.8, top: 83.0, opacity: 0.7 }, { id: 27, left: 55.4, top: 17.3, opacity: 0.5 },
    { id: 28, left: 61.1, top: 40.6, opacity: 0.4 }, { id: 29, left: 66.7, top: 63.9, opacity: 0.6 },
    { id: 30, left: 72.4, top: 87.2, opacity: 0.3 }, { id: 31, left: 78.0, top: 21.5, opacity: 0.7 },
    { id: 32, left: 83.7, top: 44.8, opacity: 0.5 }, { id: 33, left: 89.3, top: 68.1, opacity: 0.4 },
    { id: 34, left: 94.9, top: 91.4, opacity: 0.6 }, { id: 35, left: 3.2, top: 48.7, opacity: 0.3 },
    { id: 36, left: 8.9, top: 72.0, opacity: 0.7 }, { id: 37, left: 14.5, top: 5.3, opacity: 0.5 },
    { id: 38, left: 20.1, top: 28.6, opacity: 0.4 }, { id: 39, left: 25.8, top: 51.9, opacity: 0.6 },
    { id: 40, left: 31.4, top: 75.2, opacity: 0.3 }, { id: 41, left: 37.1, top: 98.5, opacity: 0.7 },
    { id: 42, left: 42.7, top: 19.8, opacity: 0.5 }, { id: 43, left: 48.4, top: 43.1, opacity: 0.4 },
    { id: 44, left: 54.0, top: 66.4, opacity: 0.6 }, { id: 45, left: 59.7, top: 89.7, opacity: 0.3 },
    { id: 46, left: 65.3, top: 24.0, opacity: 0.7 }, { id: 47, left: 71.0, top: 47.3, opacity: 0.5 },
  ],
  fallingStars: [
    { id: 0, left: 12.4, animationDelay: 1.2, animationDuration: 6.3, length: 95, opacity: 0.72 },
    { id: 1, left: 28.7, animationDelay: 4.5, animationDuration: 8.1, length: 78, opacity: 0.61 },
    { id: 2, left: 45.1, animationDelay: 7.8, animationDuration: 5.7, length: 112, opacity: 0.85 },
    { id: 3, left: 61.3, animationDelay: 2.9, animationDuration: 7.4, length: 68, opacity: 0.58 },
    { id: 4, left: 77.6, animationDelay: 6.1, animationDuration: 6.8, length: 103, opacity: 0.79 },
    { id: 5, left: 93.2, animationDelay: 0.3, animationDuration: 8.9, length: 87, opacity: 0.65 },
  ],
};

export default function HeroSection() {
  const t = useTranslations("Landing");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { resolvedTheme } = useTheme();

  // Prefetch the document page on hover
  const handleMouseEnter = () => {
    router.prefetch('/document');
  };

  // Handle click with loading state
  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push('/document');
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setIsReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
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
  const fallingStarGradient = isDark
    ? "linear-gradient(270deg, rgba(255,255,255,0.95), rgba(147,197,253,0.7), rgba(147,197,253,0))"
    : "linear-gradient(270deg, rgba(37,99,235,0.95), rgba(96,165,250,0.7), rgba(96,165,250,0))";

  const starData = isReducedMotion
    ? { stars: [], mediumStars: [], smallStars: [], fallingStars: [] }
    : STAR_DATA;

  return (
    <section className="relative h-[93.5vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/75 to-purple-50/80 dark:from-gray-900/85 dark:via-gray-800/80 dark:to-blue-900/85" />
      
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

        {/* Falling stars */}
        <div className="absolute inset-0">
          {starData.fallingStars.map((star) => (
            <div
              key={`falling-${star.id}`}
              className="absolute top-[-14%] h-px animate-star-fall will-change-transform"
              style={{
                left: `${star.left}%`,
                width: `${star.length}px`,
                opacity: star.opacity,
                backgroundImage: fallingStarGradient,
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
            {/* Badge pill */}
            <div className="flex justify-center lg:justify-start mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {t("badge")}
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-foreground mb-4 leading-tight text-center lg:text-left">
              {t("title")}
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-muted-foreground mb-6 mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
              {t("description")}
            </p>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              <Link
                href="/document"
                prefetch={true}
                onMouseEnter={handleMouseEnter}
                onClick={handleGetStartedClick}
              >
                <LoadingButton
                  size="lg"
                  className="px-6 py-3 text-base group"
                  isLoading={isNavigating}
                  loadingText={t("loading") || "Loading..."}
                >
                  <span className="flex items-center gap-2">
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </LoadingButton>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="px-6 py-3 text-base">
                  {t("viewPricing")}
                </Button>
              </Link>
            </div>

            {/* Social proof stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">50K+</span>
                <span>{t("documentsTranslated")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">50+</span>
                <span>{t("languagesSupported")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">98%</span>
                <span>{t("accuracyRate")}</span>
              </div>
            </div>
          </div>

          {/* Right column: video mockup */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <div className="relative w-full" style={{ maxWidth: '600px' }}>
              {videoError ? (
                <div className="w-full h-64 bg-muted rounded-2xl shadow-2xl ring-1 ring-border flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Video failed to load</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-2xl shadow-2xl ring-1 ring-border"
                  autoPlay={!isReducedMotion}
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
      {!isReducedMotion && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      )}
    </section>
  );
}
