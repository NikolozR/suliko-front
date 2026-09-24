"use client";

import { useId, useRef, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { DemoFrame, FakeCursor, useDemoCursor, useDemoLoop, type T } from "./shared";

/**
 * Reports demo: a cursor clicks through the four report views (revenue and
 * profit, translation volume, language pairs, sources) and flips between
 * weekly and monthly, and each chart animates in.
 *
 * Every figure here is invented. Our own bureau's revenue and profit must never
 * appear on a public page; these only show what the reports look like.
 */

type Tab = "revenue" | "volume" | "pairs" | "sources";
type Period = "month" | "week";
type Target = "week" | "month" | `tab-${Tab}`;

type Step = { ms: number; tab: Tab; period: Period; cursor?: Target; click?: boolean };

// Each switch is: aim at the control, click it (the view changes), then hold.
const STEPS: Step[] = [
  { ms: 2600, tab: "revenue", period: "month" },
  { ms: 700, tab: "revenue", period: "month", cursor: "week" },
  { ms: 300, tab: "revenue", period: "week", cursor: "week", click: true },
  { ms: 2600, tab: "revenue", period: "week", cursor: "week" },
  { ms: 700, tab: "revenue", period: "week", cursor: "tab-volume" },
  { ms: 300, tab: "volume", period: "week", cursor: "tab-volume", click: true },
  { ms: 2600, tab: "volume", period: "week", cursor: "tab-volume" },
  { ms: 700, tab: "volume", period: "week", cursor: "month" },
  { ms: 300, tab: "volume", period: "month", cursor: "month", click: true },
  { ms: 2600, tab: "volume", period: "month", cursor: "month" },
  { ms: 700, tab: "volume", period: "month", cursor: "tab-pairs" },
  { ms: 300, tab: "pairs", period: "month", cursor: "tab-pairs", click: true },
  { ms: 2800, tab: "pairs", period: "month", cursor: "tab-pairs" },
  { ms: 700, tab: "pairs", period: "month", cursor: "tab-sources" },
  { ms: 300, tab: "sources", period: "month", cursor: "tab-sources", click: true },
  { ms: 3000, tab: "sources", period: "month", cursor: "tab-sources" },
  { ms: 700, tab: "sources", period: "month", cursor: "tab-revenue" },
  { ms: 300, tab: "revenue", period: "month", cursor: "tab-revenue", click: true },
];

/** Sample figures, six periods each, oldest first. */
const DATA = {
  month: {
    revenue: [9800, 10900, 10400, 12300, 13050, 14620],
    profit: [5100, 5700, 5350, 6450, 6800, 7600],
    pages: [410, 468, 441, 512, 538, 612],
    orders: [92, 104, 98, 113, 119, 131],
  },
  week: {
    revenue: [2980, 3120, 3050, 3310, 3260, 3480],
    profit: [1540, 1630, 1580, 1720, 1700, 1810],
    pages: [118, 127, 122, 139, 133, 146],
    orders: [26, 28, 27, 30, 29, 32],
  },
} as const;

const PAIRS = [
  { pair: "KA → EN", share: 41 },
  { pair: "RU → KA", share: 19 },
  { pair: "KA → DE", share: 13 },
  { pair: "KA → FR", share: 9 },
  { pair: "KA → RU", share: 8 },
];

const SOURCES = [
  { key: "whatsapp", share: 46, color: "#2f9e5b" },
  { key: "website", share: 24, color: "#3b59f3" },
  { key: "call", share: 12, color: "#f0a020" },
  { key: "other", share: 18, color: "#c6cde0" },
] as const;

const INDIVIDUALS = 78;
const TABS: Tab[] = ["revenue", "volume", "pairs", "sources"];

const last = (xs: readonly number[]) => xs[xs.length - 1];
const trend = (xs: readonly number[]) => Math.round((last(xs) / xs[xs.length - 2] - 1) * 100);
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** Georgian groups thousands with a space, English with a comma. */
function money(n: number, locale: string): string {
  const s = n.toLocaleString("en-US");
  return `${locale === "ka" ? s.replace(/,/g, " ") : s} ₾`;
}

export default function ReportsDemo() {
  const t = useTranslations("SulikoOffice");
  const locale = useLocale();
  // Held under reduced motion: the revenue and profit view.
  const { frameRef, step, hoverProps } = useDemoLoop(STEPS, 0);
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({});
  const current = STEPS[step];
  const cursor = useDemoCursor(frameRef, targets, current.cursor, step);

  const reg = (key: Target) => (el: HTMLElement | null) => {
    targets.current[key] = el;
  };
  const pressed = (key: Target) => current.click && current.cursor === key;

  const { tab, period } = current;
  const d = DATA[period];
  const labels =
    period === "month"
      ? t("reports.months").split(",")
      : [34, 35, 36, 37, 38, 39].map((n) => t("reports.week", { n }));

  const kpis: { label: string; value: string; change?: number; note?: string }[] = [
    { label: t("reports.kRevenue"), value: money(last(d.revenue), locale), change: trend(d.revenue) },
    {
      label: t("reports.kProfit"),
      value: money(last(d.profit), locale),
      note: t("reports.margin", { pct: Math.round((last(d.profit) / last(d.revenue)) * 100) }),
    },
    { label: t("reports.kPages"), value: String(last(d.pages)), change: trend(d.pages) },
  ];

  const toggle = (
    <span className="flex gap-0.5 rounded-lg border border-border p-0.5 text-xs">
      {(["week", "month"] as const).map((p) => (
        <span
          key={p}
          ref={reg(p)}
          className={`rounded-md px-2.5 py-1 transition-[background-color,color,transform] duration-200 ${
            period === p ? "bg-[#111a3a] text-white dark:bg-white dark:text-[#111a3a]" : "text-muted-foreground"
          } ${pressed(p) ? "scale-95" : ""}`}
        >
          {t(p === "week" ? "reports.weekly" : "reports.monthly")}
        </span>
      ))}
    </span>
  );

  return (
    <DemoFrame
      frameRef={frameRef}
      hoverProps={hoverProps}
      label={t("reports.label")}
      title={t("dash.navReports")}
      headerExtra={toggle}
      overlay={<FakeCursor {...cursor} clicking={!!current.click} />}
    >
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((key) => (
          <span
            key={key}
            ref={reg(`tab-${key}`)}
            className={`rounded-full px-3 py-1.5 text-xs transition-[background-color,color,transform] duration-200 ${
              tab === key
                ? "bg-[#eef1fe] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]"
                : "text-muted-foreground"
            } ${pressed(`tab-${key}`) ? "scale-95" : ""}`}
          >
            {t(`reports.tab.${key}`)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex min-w-0 flex-col gap-1 rounded-xl bg-[#f7f8fc] px-3 py-2.5 dark:bg-white/[0.04]">
            <span className="truncate text-[11px] text-muted-foreground">{k.label}</span>
            <span key={`${period}-${k.value}`} className="truncate text-base leading-tight text-foreground tabular-nums office-pop sm:text-lg">
              {k.value}
            </span>
            {k.change !== undefined ? (
              <span className="flex items-center gap-1 text-[11px] text-[#1e7440] dark:text-emerald-300">
                <TrendingUp className="h-3 w-3" />+{k.change}%
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">{k.note}</span>
            )}
          </div>
        ))}
      </div>

      {/* Keyed by view, so each chart animates in again when it is selected. */}
      <div key={`${tab}-${period}`} className="flex h-[230px] flex-col rounded-xl border border-border p-3.5 office-fade">
        {tab === "revenue" && <RevenueChart t={t} labels={labels} revenue={d.revenue} profit={d.profit} />}
        {tab === "volume" && <VolumeChart t={t} labels={labels} pages={d.pages} orders={d.orders} />}
        {tab === "pairs" && <PairsChart t={t} />}
        {tab === "sources" && <SourcesChart t={t} />}
      </div>
    </DemoFrame>
  );
}

/* ---------------------------------------------------------------- charts */

const W = 480;
const H = 150;
const X_PAD = 12;

function xAt(i: number, n: number) {
  return X_PAD + (i * (W - X_PAD * 2)) / (n - 1);
}

/** A smooth path through the points: each segment eases between the two heights. */
function smoothPath(points: [number, number][]) {
  return points.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = points[i - 1];
    const mx = (px + x) / 2;
    return `${d} C${mx},${py} ${mx},${y} ${x},${y}`;
  }, "");
}

function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <div className="flex gap-4 text-[11px] text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={it.line ? "h-0.5 w-3 rounded" : "h-2.5 w-2.5 rounded-sm"} style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function Gridlines() {
  return (
    <>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="4 4" />
      ))}
      <line x1={0} x2={W} y1={H} y2={H} stroke="currentColor" strokeOpacity={0.2} />
    </>
  );
}

function XLabels({ labels }: { labels: string[] }) {
  return (
    <div className="flex justify-between px-1 pt-1.5 text-[10px] text-muted-foreground">
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

function RevenueChart({ t, labels, revenue, profit }: { t: T; labels: string[]; revenue: readonly number[]; profit: readonly number[] }) {
  const gradient = useId();
  const max = Math.max(...revenue) * 1.12;
  const y = (v: number) => H - (v / max) * H;
  const rev = revenue.map((v, i) => [xAt(i, revenue.length), y(v)] as [number, number]);
  const pro = profit.map((v, i) => [xAt(i, profit.length), y(v)] as [number, number]);
  const revLine = smoothPath(rev);
  const area = `${revLine} L${rev[rev.length - 1][0]},${H} L${rev[0][0]},${H} Z`;
  const [lx, ly] = rev[rev.length - 1];

  return (
    <>
      <Legend
        items={[
          { label: t("reports.kRevenue"), color: "#3b59f3", line: true },
          { label: t("reports.kProfit"), color: "#2f9e5b", line: true },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-auto w-full overflow-visible text-foreground">
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b59f3" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#3b59f3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Gridlines />
        <path d={area} fill={`url(#${gradient})`} className="office-fade" style={delay(500)} />
        <path d={revLine} pathLength={1} fill="none" stroke="#3b59f3" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="office-draw" />
        <path d={smoothPath(pro)} pathLength={1} fill="none" stroke="#2f9e5b" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="office-draw" style={delay(250)} />
        <circle cx={lx} cy={ly} r={5} fill="#3b59f3" stroke="white" strokeWidth={2} vectorEffect="non-scaling-stroke" className="office-pop" style={delay(1000)} />
      </svg>
      <XLabels labels={labels} />
    </>
  );
}

function VolumeChart({ t, labels, pages, orders }: { t: T; labels: string[]; pages: readonly number[]; orders: readonly number[] }) {
  const n = pages.length;
  const maxPages = Math.max(...pages) * 1.15;
  const maxOrders = Math.max(...orders) * 1.35;
  const slot = (W - X_PAD * 2) / (n - 1);
  const barW = slot * 0.46;
  const line = orders.map((v, i) => [xAt(i, n), H - (v / maxOrders) * H] as [number, number]);

  return (
    <>
      <Legend
        items={[
          { label: t("reports.pages"), color: "#aebcff" },
          { label: t("reports.orders"), color: "#1e7440", line: true },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-auto w-full overflow-visible text-foreground">
        <Gridlines />
        {pages.map((v, i) => {
          const h = (v / maxPages) * H;
          return (
            <rect
              key={i}
              x={Math.max(0, Math.min(W - barW, xAt(i, n) - barW / 2))}
              y={H - h}
              width={barW}
              height={h}
              rx={4}
              fill={i === n - 1 ? "#3b59f3" : "#aebcff"}
              className="office-rise"
              style={delay(i * 90)}
            />
          );
        })}
        <path d={smoothPath(line)} pathLength={1} fill="none" stroke="#1e7440" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="office-draw" style={delay(550)} />
      </svg>
      <XLabels labels={labels} />
    </>
  );
}

function PairsChart({ t }: { t: T }) {
  const top = PAIRS[0].share;
  return (
    <div className="flex h-full flex-col gap-2.5">
      <span className="text-[11px] text-muted-foreground">{t("reports.pairsNote")}</span>
      {PAIRS.map((p, i) => (
        <div key={p.pair} className="grid grid-cols-[64px_minmax(0,1fr)_34px] items-center gap-2.5 text-xs text-[#3a4466] dark:text-slate-300">
          <span>{p.pair}</span>
          <div className="h-3 overflow-hidden rounded bg-[#f1f3f9] dark:bg-white/10">
            <div
              className={`h-3 rounded office-grow ${i === 0 ? "bg-suliko-default-color" : "bg-[#aebcff]"}`}
              style={{ width: `${(p.share / top) * 100}%`, ...delay(i * 110) }}
            />
          </div>
          <span className="text-right tabular-nums">{p.share}%</span>
        </div>
      ))}
    </div>
  );
}

function SourcesChart({ t }: { t: T }) {
  let offset = 0;
  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-[118px] w-[118px] shrink-0 -rotate-90">
          <circle cx={60} cy={60} r={46} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={16} />
          {SOURCES.map((s, i) => {
            const seg = (
              <circle
                key={s.key}
                cx={60}
                cy={60}
                r={46}
                fill="none"
                stroke={s.color}
                strokeWidth={16}
                pathLength={100}
                strokeDasharray={`${s.share - 1} ${101 - s.share}`}
                strokeDashoffset={-offset}
                className="office-donut"
                style={delay(i * 180)}
              />
            );
            offset += s.share;
            return seg;
          })}
        </svg>
        <div className="flex flex-col gap-1.5 text-xs text-[#3a4466] dark:text-slate-300">
          {SOURCES.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="w-20">{t(s.key === "other" ? "reports.other" : `dash.${s.key}`)}</span>
              <span className="tabular-nums">{s.share}%</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>
            {t("reports.individuals")} {INDIVIDUALS}%
          </span>
          <span>
            {t("reports.companies")} {100 - INDIVIDUALS}%
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-[#fff4d9] dark:bg-amber-400/15">
          <div className="h-full rounded-full bg-[#f0a020] office-grow" style={{ width: `${INDIVIDUALS}%`, ...delay(500) }} />
        </div>
      </div>
    </div>
  );
}
