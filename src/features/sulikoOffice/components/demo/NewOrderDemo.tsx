"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { DemoFrame, FakeCursor, FIRST_NEW_ID, useDemoCursor, useDemoLoop } from "./shared";

/** Pricing demo: a new order's fields fill in and the price is worked out as they do. */
type Target = "field0" | "field1" | "field2" | "field3" | "save";

const STEPS: { ms: number; fill: number; cursor?: Target; click?: boolean; saved?: boolean }[] = [
  { ms: 1000, fill: 0 },
  { ms: 750, fill: 0, cursor: "field0" },
  { ms: 750, fill: 1, cursor: "field1" },
  { ms: 750, fill: 2, cursor: "field2" },
  { ms: 750, fill: 3, cursor: "field3" },
  { ms: 1100, fill: 4, cursor: "save" },
  { ms: 350, fill: 4, cursor: "save", click: true },
  { ms: 2400, fill: 4, saved: true },
];

/** Price after each field is filled: document, pair, urgency, copies. */
const PRICE_BY_FILL = [0, 0, 40, 60, 75] as const;

export default function NewOrderDemo() {
  const t = useTranslations("SulikoOffice");
  // Held under reduced motion: every field filled and the price worked out.
  const { frameRef, step, loop, hoverProps } = useDemoLoop(STEPS, 5);
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({});
  const current = STEPS[step];
  const cursor = useDemoCursor(frameRef, targets, current.cursor, step, !current.saved);

  const reg = (key: Target) => (el: HTMLElement | null) => {
    targets.current[key] = el;
  };

  const fill = current.fill;
  const price = PRICE_BY_FILL[fill];
  const fields = [
    { label: t("demo.fDoc"), value: t("dash.d1") },
    { label: t("demo.fPair"), value: "KA → EN" },
    { label: t("demo.fUrgency"), value: t("demo.vUrgent") },
    { label: t("demo.fCopies"), value: t("demo.vCopies") },
  ];
  // How the price was reached, one line per field that affects it.
  const breakdown = [
    { show: fill >= 2, label: t("demo.basePrice"), amount: "40 ₾" },
    { show: fill >= 3, label: t("demo.vUrgent"), amount: "+20 ₾" },
    { show: fill >= 4, label: t("demo.extraCopy"), amount: "+15 ₾" },
  ];
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
          const active = i === fill && !!current.cursor;
          return (
            <div
              key={f.label}
              ref={reg(`field${i}` as Target)}
              className={`rounded-xl border px-3.5 py-3 transition-[border-color,box-shadow] duration-300 ${
                active ? "border-suliko-default-color shadow-[0_0_0_3px_rgba(59,89,243,0.18)]" : "border-border"
              }`}
            >
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="mt-1.5 flex h-5 items-center text-sm text-foreground">
                {filled ? <span className="office-slide">{f.value}</span> : <span className="h-3 w-16 rounded bg-muted" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-[#e7f6ec] px-4 py-4 dark:bg-emerald-400/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#1f4a2e] dark:text-emerald-100">{t("demo.price")}</span>
            <span className="text-xs text-[#1e7440] dark:text-emerald-300">{t("demo.priceNote")}</span>
          </div>
          <span key={price} className="text-[32px] leading-none text-foreground office-pop">
            {price} ₾
          </span>
        </div>
        <div className="flex min-h-[66px] flex-col gap-1.5 border-t border-[#1e7440]/15 pt-3 dark:border-emerald-300/15">
          {breakdown
            .filter((line) => line.show)
            .map((line) => (
              <div key={line.label} className="flex justify-between gap-3 text-xs text-[#1f4a2e] office-slide dark:text-emerald-100">
                <span>{line.label}</span>
                <span>{line.amount}</span>
              </div>
            ))}
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
              fill < 4 ? "opacity-50" : ""
            } ${savePressed ? "scale-95" : ""}`}
          >
            {t("demo.save")}
          </span>
        )}
      </div>
    </DemoFrame>
  );
}
