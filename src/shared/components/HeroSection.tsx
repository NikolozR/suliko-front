"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight, Sparkles, Globe, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export default function HeroSection() {
  const t = useTranslations("Landing");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          {/* Left column: text */}
          <div className="lg:col-span-2">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-center lg:text-left">
              {t("title")}
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
              {t("description")}
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>{t("aiPowered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span>{t("languages")}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span>{t("documentSupport")}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Link href="/document">
                <Button size="lg" className="px-8 py-4 text-lg group">
                  {t("cta")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  {t("viewPricing")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column: video mockup */}
          <div className="block lg:col-span-3">
            <div className="relative w-full mx-auto lg:mx-0" style={{ maxWidth: '1000px' }}>
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
