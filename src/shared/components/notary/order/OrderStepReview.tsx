"use client";

import { useLocale, useTranslations } from "next-intl";
import { Info } from "lucide-react";
import type { OrderReference } from "@/shared/utils/notaryOrderApi";
import { displayLanguageName, documentTypeById } from "@/shared/utils/notaryReferenceData";
import { formatMoney } from "@/shared/utils/notaryEstimate";
import type { Estimate, OrderState } from "./orderState";

interface Props {
  state: OrderState;
  reference: OrderReference;
  estimate: Estimate;
}

export default function OrderStepReview({ state, reference, estimate }: Props) {
  const t = useTranslations("NotaryPage.order");
  const locale = useLocale();

  const money = (amount: number) => formatMoney(amount, estimate.currency);

  const nameOf = (code: string) =>
    displayLanguageName(
      reference.languages.find((l) => l.language_code === code),
      locale
    );

  const urgencyLabel =
    reference.urgency_levels.find((u) => u.value === state.urgency)?.label ?? state.urgency;

  return (
    <div className="space-y-4">
      {/* Per-document lines */}
      <div className="space-y-3">
        {estimate.lines.map((line) => {
          const doc = state.documents[line.index];
          if (!doc) return null;
          const typeName = documentTypeById(reference, doc.documentType);
          const copyLabel = reference.copy_types.find((c) => c.value === doc.copyType)?.label;

          return (
            <div key={doc.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-3 border-b border-border pb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t("document")} #{line.index + 1} — {nameOf(doc.fromLang)} →{" "}
                    {nameOf(doc.toLang)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {typeName
                      ? locale === "ka" && typeName.type_name_georgian
                        ? typeName.type_name_georgian
                        : typeName.type_name
                      : ""}
                    {copyLabel ? ` · ${copyLabel}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-suliko-default-color">
                  {money(line.subtotal)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {money(line.pricePerPage)} × {line.pages} {t("pagesShort")}
                {line.multiplier !== 1 && ` × ${line.multiplier}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Order-level lines */}
      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="text-foreground">{money(estimate.subtotal)}</span>
        </div>

        {estimate.urgencyCharge > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("urgencySurcharge", { level: urgencyLabel })}
              {estimate.urgencyPercent > 0 && ` (+${estimate.urgencyPercent}%)`}
            </span>
            <span className="text-foreground">{money(estimate.urgencyCharge)}</span>
          </div>
        )}

        {estimate.handoverTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("handoverExtras")}</span>
            <span className="text-foreground">{money(estimate.handoverTotal)}</span>
          </div>
        )}

        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span className="text-foreground">{t("estimatedTotal")}</span>
          <span className="text-suliko-default-color">{money(estimate.total)}</span>
        </div>
      </div>

      {/*
        Notarization is priced server-side and the formula is not published, so
        it is deliberately not guessed at. Showing a guess and then a different
        confirmed total is worse than showing nothing.
      */}
      {estimate.hasNotarized && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            {t("notarySeparate")}
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("estimateNote")}</p>
    </div>
  );
}
