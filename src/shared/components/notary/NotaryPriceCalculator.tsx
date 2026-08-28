"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Calculator,
  Check,
  ChevronDown,
  Copy,
  Info,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { SUPPORT_EMAIL } from "@/shared/utils/notaryOrderConfig";
import type { OrderReference } from "@/shared/utils/notaryOrderApi";
import {
  copyTypesFor,
  displayLanguageName,
  loadReference,
  sourcesFor,
  targetsFor,
} from "@/shared/utils/notaryReferenceData";
import { estimateOrder, formatMoney, type Estimate } from "@/shared/utils/notaryEstimate";
import { scrollToPanelTab } from "@/shared/utils/notaryScroll";
import {
  trackCta,
  trackPixelEvent,
  triggerHotjarEvent,
} from "@/shared/utils/notaryTracking";

interface CalcDocument {
  id: number;
  from: string;
  to: string;
  documentType: number | "";
  pages: number | "";
  notary: boolean;
  copyType: string;
}

let nextId = 2;

/**
 * Instant quote — handoff §6, priced entirely from the partner catalogue.
 *
 * It runs the same `estimateOrder` the wizard's review step runs, on the same
 * `reference.php` data, so a quote and an order describe the same job at the
 * same price. It quotes only pairs the partner actually publishes; there is no
 * local rate card to drift from.
 */
export default function NotaryPriceCalculator() {
  const t = useTranslations("NotaryPage.calculator.priceCalc");
  const locale = useLocale();

  const [reference, setReference] = useState<OrderReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<CalcDocument[]>([
    { id: 1, from: "", to: "", documentType: "", pages: 1, notary: false, copyType: "" },
  ]);
  const [urgency, setUrgency] = useState("standard");
  const [result, setResult] = useState<Estimate | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    loadReference().then(({ reference: ref }) => {
      if (!mounted) return;
      setReference(ref);
      setLoading(false);

      // Seed the first row with the cheapest published pair, so the panel opens
      // on a real, quotable combination rather than an empty form.
      const cheapest = [...ref.language_pairs].sort(
        (a, b) => a.price_per_page - b.price_per_page
      )[0];
      const defaultType =
        ref.document_types.find((d) => d.price_multiplier === 1) ?? ref.document_types[0];
      const defaultCopy = copyTypesFor(ref, "regular")[0]?.value ?? "";

      if (cheapest) {
        setDocuments([
          {
            id: 1,
            from: cheapest.source_language,
            to: cheapest.target_language,
            documentType: defaultType?.type_id ?? "",
            pages: 1,
            notary: false,
            copyType: defaultCopy,
          },
        ]);
      }
      setUrgency(ref.urgency_levels[0]?.value ?? "standard");
    });
    return () => {
      mounted = false;
    };
  }, []);

  const patch = useCallback((id: number, update: Partial<CalcDocument>) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...update } : doc)));
  }, []);

  /** Changing the source drops a target the catalogue no longer pairs with it. */
  const changeSource = (doc: CalcDocument, from: string) => {
    if (!reference) return;
    const targets = targetsFor(reference, from);
    const keep = targets.some((l) => l.language_code === doc.to);
    patch(doc.id, { from, to: keep ? doc.to : (targets[0]?.language_code ?? "") });
  };

  const toggleNotary = (doc: CalcDocument) => {
    if (!reference) return;
    const notary = !doc.notary;
    patch(doc.id, {
      notary,
      copyType: copyTypesFor(reference, notary ? "notary" : "regular")[0]?.value ?? "",
    });
  };

  const addDocument = () => {
    const last = documents[documents.length - 1];
    setDocuments((prev) => [...prev, { ...last, id: nextId++, pages: 1 }]);
  };

  const removeDocument = (id: number) => {
    if (documents.length > 1) setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleCalculate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reference) return;

    const breakdown = estimateOrder(
      reference,
      documents.map((doc) => ({
        fromLang: doc.from,
        toLang: doc.to,
        documentType: doc.documentType,
        pages: typeof doc.pages === "number" ? doc.pages : 1,
        copyType: doc.copyType,
      })),
      urgency
    );

    setResult(breakdown);
    setIsOpen(true);

    // Fires after the quote is produced, not at the top of the handler.
    trackCta("calculator", "calculator", {
      documents: documents.length,
      pages: breakdown.lines.reduce((sum, l) => sum + l.pages, 0),
      quoted_total: Number(breakdown.total.toFixed(2)),
    });
    triggerHotjarEvent("price_calculated");
    trackPixelEvent("CalculatePrice", { value: Number(breakdown.total.toFixed(2)) });
  };

  const copy = async (value: string, which: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
      trackCta(which === "email" ? "email" : "phone", "calculator");
      trackPixelEvent("CopyContact", { channel: which });
    } catch {
      /* clipboard permission denied — nothing useful to show */
    }
  };

  const nameOf = useCallback(
    (code: string) =>
      displayLanguageName(
        reference?.languages.find((l) => l.language_code === code),
        locale
      ),
    [reference, locale]
  );

  const whatsappLink = () => {
    if (!result || !reference) return `https://wa.me/${NOTARY_WHATSAPP}`;
    const lines = documents.map((doc, index) => {
      const line = result.lines[index];
      return `${index + 1}. ${nameOf(doc.from)} → ${nameOf(doc.to)}, ${line.pages} ${t(
        "pagesShort"
      )}${doc.notary ? ` (${t("notaryApproval")})` : ""}`;
    });
    const message = [
      t("whatsappIntro"),
      ...lines,
      `${t("totalPrice")}: ${formatMoney(result.total, result.currency)}`,
    ].join("\n");
    return `https://wa.me/${NOTARY_WHATSAPP}?text=${encodeURIComponent(message)}`;
  };

  const money = (amount: number) =>
    formatMoney(amount, result?.currency ?? reference?.currency ?? "GEL");

  const handleTouchEnd = () => {
    if (touchStart !== null && touchEnd !== null && touchEnd - touchStart > 100) {
      setIsOpen(false);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const selectClass =
    "w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50";

  if (loading || !reference) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t("loadingRates")}</span>
      </div>
    );
  }

  const sourceOptions = sourcesFor(reference);

  return (
    <div>
      <form onSubmit={handleCalculate} className="space-y-4">
        {documents.map((doc, index) => {
          const targets = doc.from ? targetsFor(reference, doc.from) : [];
          const notaryForms = copyTypesFor(reference, "notary");

          return (
            <div
              key={doc.id}
              className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {t("document")} #{index + 1}
                </span>
                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("removeDocument")}
                  </button>
                )}
              </div>

              {/* Languages — only pairs the catalogue publishes */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("sourceLanguage")}
                  </label>
                  <div className="relative">
                    <select
                      value={doc.from}
                      onChange={(e) => changeSource(doc, e.target.value)}
                      style={{ backgroundImage: "none" }}
                      className={selectClass}
                    >
                      {sourceOptions.map((lang) => (
                        <option key={lang.language_code} value={lang.language_code}>
                          {displayLanguageName(lang, locale)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("targetLanguage")}
                  </label>
                  <div className="relative">
                    <select
                      value={doc.to}
                      onChange={(e) => patch(doc.id, { to: e.target.value })}
                      style={{ backgroundImage: "none" }}
                      className={selectClass}
                    >
                      {targets.map((lang) => (
                        <option key={lang.language_code} value={lang.language_code}>
                          {displayLanguageName(lang, locale)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Document type + pages */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("documentType")}
                  </label>
                  <div className="relative">
                    <select
                      value={doc.documentType === "" ? "" : String(doc.documentType)}
                      onChange={(e) =>
                        patch(doc.id, {
                          documentType: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      style={{ backgroundImage: "none" }}
                      className={selectClass}
                    >
                      {reference.document_types.map((type) => (
                        <option key={type.type_id} value={type.type_id}>
                          {locale === "ka" && type.type_name_georgian
                            ? type.type_name_georgian
                            : type.type_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("pageCount")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={doc.pages}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        patch(doc.id, { pages: "" });
                        return;
                      }
                      const parsed = parseInt(raw, 10);
                      if (!Number.isNaN(parsed)) patch(doc.id, { pages: Math.max(1, parsed) });
                    }}
                    onBlur={() => {
                      if (doc.pages === "") patch(doc.id, { pages: 1 });
                    }}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              {/* Notary toggle */}
              <button
                type="button"
                onClick={() => toggleNotary(doc)}
                role="checkbox"
                aria-checked={doc.notary}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  doc.notary
                    ? "border-suliko-default-color bg-suliko-default-color/10"
                    : "border-border bg-card hover:border-suliko-default-color/40"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    doc.notary
                      ? "border-suliko-default-color bg-suliko-default-color"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {doc.notary && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="text-sm text-foreground">{t("notaryApproval")}</span>
              </button>

              {/* Notary forms — the partner's own copy_type codes */}
              {doc.notary && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {notaryForms.map((form) => (
                    <button
                      key={form.value}
                      type="button"
                      onClick={() => patch(doc.id, { copyType: form.value })}
                      aria-pressed={doc.copyType === form.value}
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                        doc.copyType === form.value
                          ? "border-suliko-default-color bg-suliko-default-color/10 text-suliko-default-color"
                          : "border-border bg-card text-foreground hover:border-suliko-default-color/40"
                      }`}
                    >
                      {form.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addDocument}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-suliko-default-color/50 hover:text-suliko-default-color"
        >
          <Plus className="h-4 w-4" />
          {t("addDocument")}
        </button>

        {/* Delivery speed */}
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            {t("urgency")}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {reference.urgency_levels.map((level) => {
              const surcharge = Math.round((level.multiplier - 1) * 100);
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setUrgency(level.value)}
                  aria-pressed={urgency === level.value}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    urgency === level.value
                      ? "border-suliko-default-color bg-suliko-default-color/10 text-suliko-default-color"
                      : "border-border bg-card text-foreground hover:border-suliko-default-color/40"
                  }`}
                >
                  {level.label}
                  {surcharge > 0 && <span className="ml-1 font-bold">+{surcharge}%</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-suliko-default-color px-6 py-4 font-semibold text-white shadow-sm transition-colors hover:bg-suliko-default-hover-color"
        >
          <Calculator className="h-5 w-5" />
          <span className="text-sm sm:text-base">{t("calculate")}</span>
        </button>
      </form>

      {/* Results — bottom sheet on mobile, dialog on desktop */}
      {isOpen && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl md:rounded-2xl"
            onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
            onTouchMove={(e) => setTouchEnd(e.touches[0].clientY)}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-2 md:hidden">
              <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h3 className="text-lg font-bold text-foreground sm:text-xl">
                {t("translationDetails")}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
              {result.lines.map((line, index) => {
                const doc = documents[index];
                return (
                  <div key={doc.id} className="space-y-2 rounded-xl bg-muted/40 p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {t("document")} #{index + 1} — {line.pages} {t("pagesShort")}
                      </span>
                      <span className="text-sm font-bold text-suliko-default-color">
                        {money(line.subtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {nameOf(doc.from)} → {nameOf(doc.to)} · {money(line.pricePerPage)}/
                      {t("pageSingular")}
                      {line.multiplier !== 1 && ` × ${line.multiplier}`}
                    </p>
                  </div>
                );
              })}

              {result.urgencyCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("urgencySurcharge")} (+{result.urgencyPercent}%)
                  </span>
                  <span className="text-foreground">{money(result.urgencyCharge)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-3 text-xl font-bold">
                <span className="text-foreground">{t("totalPrice")}</span>
                <span className="text-suliko-default-color">{money(result.total)}</span>
              </div>

              {/*
                Notarisation is priced by the partner from the copy_type and the
                formula is not published, so it is never guessed at here.
              */}
              {result.hasNotarized && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                    {t("notarySeparate")}
                  </p>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("estimateNote")}
              </p>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    scrollToPanelTab("order");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-suliko-default-color py-3.5 font-semibold text-white transition-colors hover:bg-suliko-default-hover-color"
                >
                  {t("orderThis")}
                </button>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCta("whatsapp", "calculator")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("sendOnWhatsapp")}
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => copy(SUPPORT_EMAIL, "email")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {copied === "email" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === "email" ? t("copied") : t("copyEmail")}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(NOTARY_PHONE, "phone")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {copied === "phone" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === "phone" ? t("copied") : t("copyPhone")}
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground md:hidden">
                {t("swipeDown")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
