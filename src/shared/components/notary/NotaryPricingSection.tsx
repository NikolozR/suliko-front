"use client";

import { useTranslations } from "next-intl";
import { Tag, Percent } from "lucide-react";

const LANGUAGE_PRICES: { name: string; price: number }[] = [
  { name: "English",    price: 20   },
  { name: "Russian",    price: 20   },
  { name: "German",     price: 30   },
  { name: "French",     price: 30   },
  { name: "Italian",    price: 25   },
  { name: "Spanish",    price: 50   },
  { name: "Turkish",    price: 22.5 },
  { name: "Armenian",   price: 25   },
  { name: "Azerbaijani",price: 22.5 },
  { name: "Arabic",     price: 45   },
  { name: "Portuguese", price: 50   },
  { name: "Dutch",      price: 50   },
  { name: "Swedish",    price: 50   },
  { name: "Norwegian",  price: 50   },
  { name: "Finnish",    price: 50   },
  { name: "Latvian",    price: 30   },
  { name: "Slovak",     price: 30   },
  { name: "Jewish",     price: 35   },
  { name: "Chinese",    price: 70   },
  { name: "Japanese",   price: 100  },
  { name: "Korean",     price: 100  },
];

export default function NotaryPricingSection() {
  const t = useTranslations("NotaryPage.pricing");

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
            <Tag className="h-3.5 w-3.5" />
            {t("sectionBadge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Language prices table */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex justify-between text-sm font-semibold text-foreground uppercase tracking-wide">
              <span>{t("languageCol")}</span>
              <span>{t("priceCol")}</span>
            </div>
            <div className="divide-y divide-border">
              {LANGUAGE_PRICES.map(({ name, price }) => (
                <div key={name} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-foreground">{name}</span>
                  <span className="text-sm font-semibold text-[var(--suliko-default-color)]">
                    {price} ₾
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Notary tiers + discounts */}
          <div className="flex flex-col gap-6">

            {/* Notary approval */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[var(--suliko-default-color)] flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">N</span>
                </span>
                {t("notaryTitle")}
              </h3>
              <div className="space-y-2">
                {(
                  [
                    { range: t("notaryTier1"), price: t("notaryTier1Price") },
                    { range: t("notaryTier2"), price: t("notaryTier2Price") },
                    { range: t("notaryTier3"), price: t("notaryTier3Price") },
                    { range: t("notaryTier4"), price: t("notaryTier4Price") },
                  ] as const
                ).map(({ range, price }) => (
                  <div key={range} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{range}</span>
                    <span className="font-semibold text-foreground">{price}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
                {t("vatNote")}
              </p>
            </div>

            {/* Discounts */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Percent className="h-4 w-4 text-[var(--suliko-default-color)]" />
                {t("discountTitle")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm">
                  <span className="font-bold text-green-600 dark:text-green-400">-10%</span>
                  <span className="text-foreground/80">{t("discount1")}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm">
                  <span className="font-bold text-blue-600 dark:text-blue-400">-15%</span>
                  <span className="text-foreground/80">{t("discount2")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
