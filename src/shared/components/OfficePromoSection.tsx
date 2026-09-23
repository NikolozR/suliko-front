"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, LayoutDashboard } from "lucide-react";

/**
 * Points bureau owners on the main landing page at Suliko Office (/tms).
 * A light card rather than another gradient band, so it doesn't blur into
 * NotaryPromoSection when the two sit near each other.
 */
export default function OfficePromoSection() {
  const t = useTranslations("OfficePromo");

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-suliko-default-color/10">
              <LayoutDashboard className="h-7 w-7 text-suliko-default-color" aria-hidden />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">{t("heading")}</h2>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">{t("subheading")}</p>
            </div>
          </div>

          <Link
            href="/tms"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-suliko-default-color px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-suliko-default-hover-color"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
