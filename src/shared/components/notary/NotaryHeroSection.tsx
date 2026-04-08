"use client";

import { useTranslations } from "next-intl";
import { Shield, Clock, Zap, Upload, ChevronDown } from "lucide-react";

const TRUST_BADGES = [
  { icon: Shield, key: "badge1" as const },
  { icon: Clock,  key: "badge2" as const },
  { icon: Zap,    key: "badge3" as const },
];

export default function NotaryHeroSection() {
  const t = useTranslations("NotaryPage.hero");

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative flex min-h-[93.5vh] items-center overflow-hidden bg-slate-950">
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5" />
            {t("badge")}
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("heading")}
          </h1>

          {/* Subheading */}
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {t("subheading")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              onClick={scrollToContact}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--suliko-default-color)] px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-[var(--suliko-default-hover-color)] transition-colors duration-200"
            >
              <Upload className="h-4 w-4" />
              {t("cta")}
            </button>
            <button
              onClick={scrollToPricing}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-6 py-3 text-base font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-colors duration-200"
            >
              {t("ctaSecondary")}
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {TRUST_BADGES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-blue-400" />
                {t(key)}
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
}
