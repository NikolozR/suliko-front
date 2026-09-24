"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { DemoFrame, FIRST_NEW_ID, OrderLine, useDemoLoop } from "./shared";

/** Finance demo: an order's money is recorded line by line, and the month's totals follow. */
const STEPS: { ms: number; paid: number }[] = [
  { ms: 1000, paid: 0 },
  { ms: 800, paid: 1 },
  { ms: 800, paid: 2 },
  { ms: 800, paid: 3 },
  { ms: 3000, paid: 4 },
];

export default function PayoutsDemo() {
  const t = useTranslations("SulikoOffice");
  // Held under reduced motion: everything recorded, profit shown.
  const { frameRef, step, loop, hoverProps } = useDemoLoop(STEPS, 4);
  const paid = STEPS[step].paid;

  const lines = [
    { label: t("demo.clientPayment"), amount: "+75 ₾", positive: true },
    { label: t("demo.translatorPayout"), amount: "−30 ₾", positive: false },
    { label: t("demo.notaryFee"), amount: "−15 ₾", positive: false },
  ];
  // The month's totals tick up as this order's payouts are recorded.
  const tiles = [
    {
      label: t("demo.monthTranslators"),
      value: paid >= 2 ? "2,370 ₾" : "2,340 ₾",
      bumped: paid >= 2,
      tone: "bg-[#eef1fe] dark:bg-[#3b59f3]/15",
    },
    {
      label: t("demo.monthNotary"),
      value: paid >= 3 ? "875 ₾" : "860 ₾",
      bumped: paid >= 3,
      tone: "bg-[#fff4d9] dark:bg-amber-400/10",
    },
  ];

  return (
    <DemoFrame frameRef={frameRef} hoverProps={hoverProps} label={t("demo.labelPayouts")} title={t("demo.financeTitle")}>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <OrderLine id={`#${FIRST_NEW_ID + loop}`} doc={t("dash.d1")} pair="KA → EN" />
        </div>
        <div className="flex flex-col">
          {lines.map((l, i) => (
            <div
              key={l.label}
              className={`flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5 text-sm transition-opacity duration-300 ${
                i < paid ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="flex items-center gap-2 text-[#3a4466] dark:text-slate-300">
                <Check className={`h-4 w-4 ${l.positive ? "text-[#1e7440] dark:text-emerald-300" : "text-muted-foreground"}`} />
                {l.label}
              </span>
              <span className={l.positive ? "text-[#1e7440] dark:text-emerald-300" : "text-foreground"}>{l.amount}</span>
            </div>
          ))}
        </div>
        <div
          className={`m-3 flex items-center justify-between rounded-lg bg-[#e7f6ec] px-4 py-3.5 transition-opacity duration-500 dark:bg-emerald-400/10 ${
            paid >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-sm text-[#1f4a2e] dark:text-emerald-100">{t("demo.orderProfit")}</span>
          <span className="text-2xl leading-none text-foreground">30 ₾</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={`flex flex-col gap-1.5 rounded-xl px-4 py-3.5 ${tile.tone}`}>
            <span className="text-xs text-[#3a4466] dark:text-slate-300">{tile.label}</span>
            <span key={tile.value} className={`text-xl leading-none text-foreground ${tile.bumped ? "office-pop" : ""}`}>
              {tile.value}
            </span>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}
