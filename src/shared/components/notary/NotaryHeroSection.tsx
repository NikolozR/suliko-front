"use client";

import { useTranslations } from "next-intl";
import { Shield, Clock, Zap, Upload, ChevronDown } from "lucide-react";
import { forwardRef } from "react";

const TRUST_BADGES = [
  { icon: Shield, key: "badge1" as const },
  { icon: Clock,  key: "badge2" as const },
  { icon: Zap,    key: "badge3" as const },
];

const NotaryHeroSection = forwardRef<HTMLElement>(function NotaryHeroSection(_, ref) {
  const t = useTranslations("NotaryPage.hero");

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToContact = () => {
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={ref} id="notary-hero" className="relative flex min-h-[93.5vh] items-center overflow-hidden bg-slate-950">
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* Left column: text content */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">

            {/* Badge row */}
            <div className="mb-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
                {t("badge")}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-4 py-1.5 text-sm font-semibold text-green-300 backdrop-blur-sm">
                <span className="text-green-400">₾</span>
                {t("priceBadge")}
              </div>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {t("heading")}
            </h1>

            {/* Subheading */}
            <p className="mb-10 text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl">
              {t("subheading")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full">
              <button
                onClick={scrollToContact}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-suliko-default-color px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-suliko-default-color] transition-colors duration-200 w-full sm:w-auto shrink-0 whitespace-normal text-center"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                {t("cta")}
              </button>
              <button
                onClick={scrollToPricing}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-colors duration-200 w-full sm:w-auto shrink-0 whitespace-normal text-center"
              >
                {t("ctaSecondary")}
              </button>
            </div>
          </div>

          {/* Right column: trust badges */}
          <div className="flex flex-col gap-4">
            {TRUST_BADGES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/40 px-5 py-4 text-sm text-slate-300 backdrop-blur-sm"
              >
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <span className="font-medium">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-slate-500" />
      </div>
    </section>
  );
});

export default NotaryHeroSection;
