"use client";

import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import { STATUS_CHIP, type StatusKey } from "../tones";
import { DemoFrame, DemoToast, FIRST_NEW_ID, useDemoLoop } from "./shared";

/** Hero demo: the dashboard, where a finished order lands and is counted. */
const STEPS = [
  { ms: 2800, done: false },
  { ms: 3800, done: true },
] as const;

const BASE_ORDERS = 124;
const BASE_WHATSAPP = 14;

export default function OverviewDemo() {
  const t = useTranslations("SulikoOffice");
  const { frameRef, step, loop, hoverProps } = useDemoLoop(STEPS, 0);
  const done = STEPS[step].done;

  const newId = `#${FIRST_NEW_ID + loop}`;
  // The latest finished order stays at the top of the list between loops.
  const completedId = done ? newId : loop > 0 ? `#${FIRST_NEW_ID + loop - 1}` : null;
  const counted = loop + (done ? 1 : 0);

  const sources = [
    { label: t("dash.whatsapp"), value: BASE_WHATSAPP + counted, width: "100%", bumped: done },
    { label: t("dash.website"), value: 10, width: "71%", bumped: false },
    { label: t("dash.call"), value: 7, width: "50%", bumped: false },
  ];

  const base: { id: string; doc: string; pair: string; status: StatusKey }[] = [
    { id: "#1042", doc: t("dash.d1"), pair: "KA → EN", status: "translator" },
    { id: "#1041", doc: t("dash.d2"), pair: "RU → KA", status: "notary" },
    { id: "#1040", doc: t("dash.d3"), pair: "KA → DE", status: "ready" },
    { id: "#1039", doc: t("dash.d4"), pair: "KA → FR", status: "nw" },
  ];
  const rows = completedId
    ? [{ id: completedId, doc: t("dash.d1"), pair: "KA → EN", status: "done" as StatusKey }, ...base.slice(0, 3)]
    : base;

  const sidebar = (
    <div aria-hidden className="hidden w-[150px] shrink-0 flex-col gap-1 border-r border-border bg-[#f7f8fc] px-3 py-5 sm:flex dark:bg-white/[0.03]">
      <div className="px-2 pb-4 text-[13px] text-foreground">Suliko Office</div>
      {[t("dash.title"), t("dash.navOrders"), t("dash.navClients"), t("dash.navTranslators"), t("dash.navFinance"), t("dash.navReports")].map(
        (item, i) => (
          <div
            key={item}
            className={`rounded-lg px-2.5 py-2 text-[13px] ${
              i === 0 ? "bg-[#eef1fe] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]" : "text-muted-foreground"
            }`}
          >
            {item}
          </div>
        )
      )}
    </div>
  );

  return (
    <DemoFrame
      frameRef={frameRef}
      hoverProps={hoverProps}
      label={t("demo.labelOverview")}
      sidebar={sidebar}
      title={
        <span className="flex items-center gap-2.5">
          {t("dash.title")}
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{t("dash.month")}</span>
        </span>
      }
      headerExtra={
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-suliko-default-color px-3 text-xs text-white">
          <Plus className="h-3.5 w-3.5" />
          {t("demo.newOrder")}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#eef1fe] px-4 py-3.5 dark:bg-[#3b59f3]/15">
          <span className="text-xs text-[#3a4466] dark:text-slate-300">{t("dash.kOrders")}</span>
          <span key={counted} className={`text-[30px] leading-none text-foreground ${done ? "office-pop" : ""}`}>
            {BASE_ORDERS + counted}
          </span>
          <span className="text-xs text-[#1e7440] dark:text-emerald-300">{t("dash.kOrdersDelta")}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#fff4d9] px-4 py-3.5 dark:bg-amber-400/10">
          <span className="text-xs text-[#5c4a1a] dark:text-amber-100">{t("dash.kClients")}</span>
          <span className="text-[30px] leading-none text-foreground">742</span>
          <span className="text-xs text-[#5c4a1a] dark:text-amber-100">{t("dash.kClientsNote")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl bg-[#e7f6ec] px-4 py-3.5 dark:bg-emerald-400/10">
        <span className="text-xs text-[#1f4a2e] dark:text-emerald-100">{t("dash.kSources")}</span>
        <div className="grid grid-cols-[90px_minmax(0,1fr)_24px] items-center gap-x-2.5 gap-y-2 text-xs text-[#1f4a2e] dark:text-emerald-100">
          {sources.map((s) => (
            <SourceRow key={s.label} {...s} />
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-3.5 py-2.5 text-[13px] text-foreground">{t("dash.recent")}</div>
        {rows.map((o, i) => (
          <div
            key={o.id}
            className={`grid grid-cols-[48px_minmax(0,1fr)_58px] items-center gap-2 px-3.5 py-2 text-xs text-[#3a4466] sm:grid-cols-[50px_minmax(0,1fr)_64px_138px] dark:text-slate-300 ${
              i < rows.length - 1 ? "border-b border-border/60" : ""
            } ${done && i === 0 ? "bg-[#eef1fe] office-fade dark:bg-[#3b59f3]/10" : ""}`}
          >
            <span className="text-[#7a8299] dark:text-slate-400">{o.id}</span>
            <span className="truncate">{o.doc}</span>
            <span>{o.pair}</span>
            <span className={`hidden justify-self-start truncate rounded-full px-2 py-1 sm:inline ${STATUS_CHIP[o.status]}`}>
              {t(`st.${o.status}`)}
            </span>
          </div>
        ))}
      </div>

      {done && (
        <DemoToast>
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {t("demo.completed", { id: newId })}
        </DemoToast>
      )}
    </DemoFrame>
  );
}

function SourceRow({ label, value, width, bumped }: { label: string; value: number; width: string; bumped: boolean }) {
  return (
    <>
      <span>{label}</span>
      <div className="h-2 rounded bg-white dark:bg-white/10">
        <div className="h-2 rounded bg-[#2f9e5b]" style={{ width }} />
      </div>
      <span key={value} className={`text-right ${bumped ? "office-pop" : ""}`}>
        {value}
      </span>
    </>
  );
}
