"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Tag, Zap } from "lucide-react";
import type { OrderReference } from "@/shared/utils/notaryOrderApi";
import { displayLanguageName, loadReference } from "@/shared/utils/notaryReferenceData";
import { currencySymbol, lowestPricePerPage } from "@/shared/utils/notaryEstimate";

/**
 * Published rate card — every row comes from the partner's `reference.php`.
 *
 * Rates are per direction, not per pair: `es-ka` is 50 while `ka-es` is 40, so
 * collapsing the two into one row would misquote half of them.
 */
export default function NotaryPricingSection() {
  const t = useTranslations("NotaryPage.pricing");
  const locale = useLocale();

  const [reference, setReference] = useState<OrderReference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadReference().then(({ reference: ref }) => {
      if (!mounted) return;
      setReference(ref);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (!reference) return [];
    const nameOf = (code: string) =>
      displayLanguageName(
        reference.languages.find((l) => l.language_code === code),
        locale
      );

    return [...reference.language_pairs]
      .map((pair) => ({
        key: pair.language_pair,
        from: nameOf(pair.source_language),
        to: nameOf(pair.target_language),
        price: pair.price_per_page,
      }))
      .sort((a, b) => a.price - b.price || a.from.localeCompare(b.from));
  }, [reference, locale]);

  const symbol = currencySymbol(reference?.currency ?? "GEL");
  const from = reference ? lowestPricePerPage(reference) : 0;

  return (
    <section id="pricing" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Tag className="h-3.5 w-3.5" />
            {t("sectionBadge")}
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {reference
              ? t("subheadingLive", { from, currency: symbol, pairs: rows.length })
              : t("subheadingLoading")}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Per-direction rate table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
            <div className="flex justify-between border-b border-border bg-muted/40 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-foreground">
              <span>{t("directionCol")}</span>
              <span>{t("priceCol")}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("loadingRates")}</span>
              </div>
            ) : (
              <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {rows.map(({ key, from: src, to, price }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/30"
                  >
                    <span className="text-sm text-foreground">
                      {src} <span className="text-muted-foreground">→</span> {to}
                    </span>
                    <span className="text-sm font-semibold text-suliko-default-color">
                      {price} {symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
              {t("directionNote")}
            </p>
          </div>

          {/* Surcharges + what isn't priced here */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <Zap className="h-4 w-4 text-suliko-default-color" />
                {t("urgencyTitle")}
              </h3>
              <div className="space-y-2">
                {(reference?.urgency_levels ?? []).map((level) => {
                  const surcharge = Math.round((level.multiplier - 1) * 100);
                  return (
                    <div
                      key={level.value}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{level.label}</span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {surcharge > 0 ? `+${surcharge}%` : t("included")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                {t("handoverTitle")}
              </h3>
              <div className="space-y-2">
                {(reference?.handover_methods ?? []).map((method) => (
                  <div
                    key={method.value}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">{method.label}</span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {method.extra_cost > 0
                        ? `+${method.extra_cost} ${symbol}`
                        : t("included")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                {t("notaryNote")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
