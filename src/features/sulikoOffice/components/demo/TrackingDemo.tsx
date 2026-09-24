"use client";

import { useTranslations } from "next-intl";
import { STATUS_CHIP, STATUS_ORDER, type StatusKey } from "../tones";
import { DemoFrame, FIRST_NEW_ID, OrderLine, useDemoLoop } from "./shared";

/** Tracking demo: a new order moves through every status, and gets a translator on the way. */
const STEPS: { ms: number; status: StatusKey }[] = [
  { ms: 1300, status: "nw" },
  { ms: 1000, status: "paid" },
  { ms: 1400, status: "translator" },
  { ms: 1000, status: "correcting" },
  { ms: 1000, status: "notary" },
  { ms: 1000, status: "ready" },
  { ms: 2400, status: "done" },
];

export default function TrackingDemo() {
  const t = useTranslations("SulikoOffice");
  // Held under reduced motion: mid-way, with a translator assigned.
  const { frameRef, step, loop, hoverProps } = useDemoLoop(STEPS, 4);
  const status = STEPS[step].status;
  const reached = STATUS_ORDER.indexOf(status);

  const others: { id: string; doc: string; pair: string; status: StatusKey }[] = [
    { id: "#1042", doc: t("dash.d1"), pair: "KA → EN", status: "translator" },
    { id: "#1041", doc: t("dash.d2"), pair: "RU → KA", status: "notary" },
    { id: "#1040", doc: t("dash.d3"), pair: "KA → DE", status: "ready" },
    { id: "#1039", doc: t("dash.d4"), pair: "KA → FR", status: "paid" },
  ];

  return (
    <DemoFrame frameRef={frameRef} hoverProps={hoverProps} label={t("demo.labelTrack")} title={t("dash.navOrders")}>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        {/* Keyed by loop so each new order slides in at the top. */}
        <div key={loop} className="flex flex-col gap-2.5 bg-[#eef1fe] px-3.5 py-3.5 office-enter dark:bg-[#3b59f3]/10">
          <OrderLine id={`#${FIRST_NEW_ID + loop}`} doc={t("dash.d1")} pair="KA → EN" />
          <div className="flex min-h-6 flex-wrap items-center gap-2">
            <span key={status} className={`rounded-full px-2.5 py-1 text-xs office-pop ${STATUS_CHIP[status]}`}>
              {t(`st.${status}`)}
            </span>
            {reached >= 2 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-1 py-0.5 pr-2.5 text-xs text-[#3a4466] office-slide dark:bg-white/10 dark:text-slate-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fff4d9] text-[10px] text-[#7a4f00] dark:bg-amber-400/20 dark:text-amber-200">
                  {t("demo.assignee").charAt(0)}
                </span>
                {t("demo.assignee")}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {STATUS_ORDER.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= reached ? "bg-suliko-default-color" : "bg-white dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
        {others.map((o) => (
          <div key={o.id} className="flex flex-col gap-2 border-t border-border/60 px-3.5 py-3">
            <OrderLine id={o.id} doc={o.doc} pair={o.pair} />
            <span className={`self-start rounded-full px-2.5 py-1 text-xs ${STATUS_CHIP[o.status]}`}>{t(`st.${o.status}`)}</span>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}
