"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { BOOK_DEMO_URL } from "@/shared/constants/booking";
import { useAutoplay } from "./useAutoplay";

/** The page's last word before the footer: the free pages, and one button. */
export default function ClosingCtaSection() {
  const t = useTranslations("ClosingCta");
  const { ref, running } = useAutoplay<HTMLElement>();

  return (
    <section ref={ref} data-paused={!running || undefined} className="bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div
        data-reveal
        className="container relative mx-auto flex flex-col items-center gap-5 overflow-hidden rounded-[28px] bg-[#0b1230] px-6 py-16 text-center sm:py-20"
      >
        <div
          aria-hidden="true"
          className="lp-drift pointer-events-none absolute -top-40 -left-20 h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(59,89,243,0.55),rgba(59,89,243,0))]"
        />
        <div
          aria-hidden="true"
          className="lp-drift pointer-events-none absolute -right-28 -bottom-56 h-[560px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(99,120,255,0.35),rgba(99,120,255,0))]"
          style={{ animationDuration: "15s", animationDirection: "alternate-reverse" }}
        />

        <h2 className="relative max-w-3xl text-balance text-3xl font-bold leading-tight text-white sm:text-5xl">
          {t("title")}
        </h2>
        <p className="relative max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">{t("subtitle")}</p>
        <div className="relative mt-2 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/document"
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-[#11289c] transition-colors hover:bg-blue-50"
          >
            <span
              aria-hidden="true"
              className="lp-sheen absolute inset-y-0 left-0 w-14 bg-[linear-gradient(90deg,rgba(59,89,243,0),rgba(59,89,243,0.18),rgba(59,89,243,0))]"
            />
            <span className="relative">{t("cta")}</span>
            <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <a
            href={BOOK_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium text-blue-200 transition-colors hover:text-white"
          >
            {t("bookDemo")} →
          </a>
        </div>
      </div>
    </section>
  );
}
