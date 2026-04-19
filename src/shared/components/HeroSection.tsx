"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LoadingButton } from "@/features/ui/components/loading";

export default function HeroSection() {
  const t = useTranslations("Landing");
  const router = useRouter();
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [demoUrl, setDemoUrl] = useState("suliko.ai/document");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (host.endsWith(".ge")) setDemoUrl("suliko.ge/document");
    else if (host.endsWith(".io")) setDemoUrl("suliko.io/document");
  }, []);

  const handleMouseEnter = () => router.prefetch("/document");

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push("/document");
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setIsReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => v.play().catch(() => {});
    const onError = () => setVideoError(true);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
    };
  }, []);

  return (
    <section className="relative flex min-h-[93.5vh] items-center overflow-hidden bg-slate-950">
      {/* Ambient glow orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">

          {/* ── Left: copy ── */}
          <div className="flex flex-col items-start">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              {t("badge")}
            </div>

            {/* Heading */}
            <h1 className="mb-5 max-w-xl text-balance text-[2.75rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
              {t("title")}
            </h1>

            {/* Sub-heading */}
            <p className="mb-8 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("description")}
            </p>

            {/* CTAs */}
            <div className="mb-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/document"
                prefetch
                onMouseEnter={handleMouseEnter}
                onClick={handleGetStartedClick}
              >
                <LoadingButton
                  size="lg"
                  className="w-full sm:w-auto group"
                  isLoading={isNavigating}
                  loadingText="Loading…"
                >
                  <span className="flex items-center gap-2">
                    {t("cta")}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </LoadingButton>
              </Link>
              <Link href="/notary">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white sm:w-auto"
                >
                  {t("viewPricing")}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-3 gap-6">
              {[
                { value: "50K+", label: t("documentsTranslated") },
                { value: "50+", label: t("languagesSupported") },
                { value: "98%", label: t("accuracyRate") },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <dd className="text-2xl font-bold text-white">{stat.value}</dd>
                  <dt className="text-xs leading-snug text-slate-500">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Right: product mockup ── */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Glow behind card */}
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-3xl bg-blue-500/20 blur-3xl"
            />

            {/* Browser chrome */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900 shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-slate-900/90 px-4 py-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <div className="h-3 w-3 rounded-full bg-red-400/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                  <div className="h-3 w-3 rounded-full bg-green-400/60" />
                </div>
                <div className="mx-3 flex h-5 flex-1 items-center overflow-hidden rounded-full bg-white/[0.05] px-3">
                  <span className="truncate text-xs text-slate-500">{demoUrl}</span>
                </div>
              </div>

              {/* Video */}
              {videoError ? (
                <div className="flex aspect-video w-full items-center justify-center bg-slate-900">
                  <p className="text-sm text-slate-600">{t("videoUnavailable")}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="block h-auto w-full"
                  title="Suliko product demo"
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
    </section>
  );
}
