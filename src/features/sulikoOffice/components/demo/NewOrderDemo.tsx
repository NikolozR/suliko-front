"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { calculateDocument, DEFAULT_PRICING } from "@/shared/utils/notaryPricing";
import { DemoFrame, FakeCursor, FIRST_NEW_ID, useDemoCursor, useDemoLoop } from "./shared";

/**
 * Pricing demo: a new order is filled in, and the translation price, the notary
 * fee and the total are worked out as the pages and documents change.
 */
type Target = "doc" | "pair" | "pages" | "docs" | "notary" | "save";

type Step = {
  ms: number;
  /** How many fields are filled in: document, pair, pages, documents, notary. */
  fill: number;
  pages: number;
  docs: number;
  cursor?: Target;
  click?: boolean;
  saved?: boolean;
};

const STEPS: Step[] = [
  { ms: 900, fill: 0, pages: 1, docs: 1 },
  { ms: 700, fill: 0, pages: 1, docs: 1, cursor: "doc" },
  { ms: 700, fill: 1, pages: 1, docs: 1, cursor: "pair" },
  { ms: 700, fill: 2, pages: 1, docs: 1, cursor: "pages" },
  { ms: 700, fill: 3, pages: 1, docs: 1, cursor: "docs" },
  { ms: 800, fill: 4, pages: 1, docs: 1, cursor: "notary" },
  // 1 document, 1 page, notarised.
  { ms: 1900, fill: 5, pages: 1, docs: 1, cursor: "pages" },
  // 1 document, 2 pages.
  { ms: 1900, fill: 5, pages: 2, docs: 1, cursor: "docs" },
  // 2 documents, 2 pages each.
  { ms: 1500, fill: 5, pages: 2, docs: 2 },
  { ms: 900, fill: 5, pages: 2, docs: 2, cursor: "save" },
  { ms: 350, fill: 5, pages: 2, docs: 2, cursor: "save", click: true },
  { ms: 2400, fill: 5, pages: 2, docs: 2, saved: true },
];

/**
 * Priced by the same engine and defaults as the public notary calculator on
 * suliko.ge/notary: Georgian to English, notarised as a plain copy. That gives
 * the notary fees quoted to bureaus: 12.08 ₾ for a one-page document, 14.44 ₾
 * for two pages, and 28.88 ₾ for two two-page documents.
 */
function priceOrder(pages: number, docs: number, notarised: boolean) {
  const doc = calculateDocument(DEFAULT_PRICING, {
    from: "georgian",
    to: "english",
    pages,
    notary: notarised,
    notaryForm: "notary_copy",
  });
  const cents = (n: number) => Math.round(n * docs * 100) / 100;
  return { translation: cents(doc.translation - doc.discount), notary: cents(doc.notary), total: cents(doc.total) };
}

const gel = (n: number) => `${n.toFixed(2)} ₾`;

export default function NewOrderDemo() {
  const t = useTranslations("SulikoOffice");
  // Held under reduced motion: the two-document order, fully priced.
  const { frameRef, step, loop, hoverProps } = useDemoLoop(STEPS, 8);
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({});
  const current = STEPS[step];
  const cursor = useDemoCursor(frameRef, targets, current.cursor, step, !current.saved);

  const reg = (key: Target) => (el: HTMLElement | null) => {
    targets.current[key] = el;
  };

  const { fill, pages, docs } = current;
  const notarised = fill >= 5;
  const priced = priceOrder(pages, docs, notarised);
  // Nothing is priced until the pages and documents are known.
  const translation = fill >= 4 ? priced.translation : 0;
  const notary = priced.notary;
  const total = fill >= 4 ? priced.total : 0;

  const fields: { key: Target; label: string; value: string }[] = [
    { key: "doc", label: t("demo.fDoc"), value: t("dash.d1") },
    { key: "pair", label: t("demo.fPair"), value: "KA → EN" },
    { key: "pages", label: t("demo.fPages"), value: t("demo.vPages", { count: pages }) },
    { key: "docs", label: t("demo.fDocs"), value: t("demo.vDocs", { count: docs }) },
  ];
  const activeField = current.cursor;
  const savePressed = current.click && current.cursor === "save";

  return (
    <DemoFrame
      frameRef={frameRef}
      hoverProps={hoverProps}
      label={t("demo.labelNew")}
      title={t("demo.newOrder")}
      overlay={<FakeCursor {...cursor} clicking={!!current.click} />}
    >
      <div className="rounded-xl border border-border px-3.5 py-3">
        <div className="text-xs text-muted-foreground">{t("demo.fClient")}</div>
        <div className="mt-1.5 flex h-5 items-center text-sm text-foreground">{t("demo.clientValue")}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => {
          const filled = i < fill;
          const active = activeField === f.key;
          return (
            <div
              key={f.key}
              ref={reg(f.key)}
              className={`rounded-xl border px-3.5 py-3 transition-[border-color,box-shadow] duration-300 ${
                active ? "border-suliko-default-color shadow-[0_0_0_3px_rgba(59,89,243,0.18)]" : "border-border"
              }`}
            >
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="mt-1.5 flex h-5 items-center text-sm text-foreground">
                {filled ? (
                  <span key={f.value} className="office-slide">
                    {f.value}
                  </span>
                ) : (
                  <span className="h-3 w-16 rounded bg-muted" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={reg("notary")}
        className={`flex items-center justify-between rounded-xl border px-3.5 py-3 transition-[border-color,box-shadow] duration-300 ${
          activeField === "notary" ? "border-suliko-default-color shadow-[0_0_0_3px_rgba(59,89,243,0.18)]" : "border-border"
        }`}
      >
        <span className="text-sm text-foreground">{t("demo.fNotary")}</span>
        <span
          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-300 ${
            notarised ? "bg-suliko-default-color" : "bg-muted"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${notarised ? "translate-x-5" : ""}`}
          />
        </span>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl bg-[#e7f6ec] px-4 py-4 dark:bg-emerald-400/10">
        <PriceLine label={t("demo.translation")} value={translation ? gel(translation) : ""} />
        <PriceLine label={t("demo.notaryFee")} value={notarised ? gel(notary) : ""} highlight={notarised} />
        <div className="flex items-end justify-between gap-4 border-t border-[#1e7440]/15 pt-3 dark:border-emerald-300/15">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#1f4a2e] dark:text-emerald-100">{t("demo.total")}</span>
            <span className="text-xs text-[#1e7440] dark:text-emerald-300">{t("demo.priceNote")}</span>
          </div>
          <span key={total} className="text-[28px] leading-none text-foreground office-pop">
            {gel(total)}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        {current.saved ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e7440] px-4 text-sm text-white office-pop dark:bg-emerald-600">
            <Check className="h-4 w-4" />
            {t("demo.saved", { id: `#${FIRST_NEW_ID + loop}` })}
          </span>
        ) : (
          <span
            ref={reg("save")}
            className={`inline-flex h-10 items-center rounded-lg bg-suliko-default-color px-5 text-sm text-white transition-[transform,opacity] duration-150 ${
              fill < 5 ? "opacity-50" : ""
            } ${savePressed ? "scale-95" : ""}`}
          >
            {t("demo.save")}
          </span>
        )}
      </div>
    </DemoFrame>
  );
}

/** One row of the price breakdown. The value pops whenever it changes. */
function PriceLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex h-6 items-center justify-between gap-3 text-sm text-[#1f4a2e] dark:text-emerald-100">
      <span>{label}</span>
      {value && (
        <span key={value} className={`office-pop ${highlight ? "rounded-md bg-white px-2 py-0.5 dark:bg-white/10" : ""}`}>
          {value}
        </span>
      )}
    </div>
  );
}
