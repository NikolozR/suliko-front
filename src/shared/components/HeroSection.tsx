"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/features/ui";
import { ArrowRight, LayoutDashboard, Zap } from "lucide-react";
import { useState } from "react";
import { LoadingButton } from "@/features/ui/components/loading";
import HeroDemo from "@/shared/components/landing/HeroDemo";

export default function HeroSection() {
  const t = useTranslations("Landing");
  const tOffice = useTranslations("OfficePromo");
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleMouseEnter = () => router.prefetch("/document");

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push("/document");
  };

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
            <div className="mb-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
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

            {/*
              For translation bureaus: the way into Suliko Office, the TMS. The demo
              booking line that sat above it moved out to keep the hero calm; booking
              stays one click away in BookDemoBubble and the footer.
            */}
            <Link
              href="/tms"
              className="group mb-14 inline-flex max-w-full items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 py-1.5 pr-3.5 pl-1.5 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-suliko-default-color px-2 py-0.5 text-xs font-medium text-white">
                <LayoutDashboard className="h-3 w-3" aria-hidden="true" />
                Suliko Office
              </span>
              <span className="min-w-0 leading-snug sm:truncate">{tOffice("heroLink")}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>

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

          {/* ── Right: live product demo ── */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div aria-hidden="true" className="absolute inset-4 rounded-3xl bg-blue-500/20 blur-3xl" />
            <HeroDemo />
          </div>

        </div>
      </div>
    </section>
  );
}
