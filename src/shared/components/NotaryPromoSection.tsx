"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Stamp } from "lucide-react";

export default function NotaryPromoSection() {
  const t = useTranslations("NotaryPromo");

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--suliko-default-color)] via-blue-600 to-indigo-700" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">

          {/* Icon + text */}
          <div className="flex items-start gap-5">
            <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Stamp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {t("heading")}
              </h2>
              <p className="text-blue-100 text-base leading-relaxed max-w-md">
                {t("subheading")}
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/notary" className="shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-[var(--suliko-default-color)] shadow-lg hover:bg-blue-50 transition-colors duration-200"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
