"use client";

import { useEffect, useReducer } from "react";
import { useTranslations } from "next-intl";
import { Bell, Plus } from "lucide-react";
import { calculateDocument, DEFAULT_PRICING } from "@/shared/utils/notaryPricing";
import { STATUS_CHIP, STATUS_ORDER, type StatusKey } from "../tones";
import { DemoFrame, FIRST_NEW_ID, useDemoLoop } from "./shared";

/**
 * Hero demo: the dashboard as a live feed. Every couple of seconds something
 * happens (a new order arrives from one of the sources, a payment comes in, an
 * order moves to its next status) and a notice at the bottom says what.
 *
 * The feed keeps evolving instead of resetting: each event is applied to the
 * previous state, so orders work their way down the list and out of it.
 */

/** One event per tick; `useDemoLoop`'s loop counter is the event number. */
const TICK = [{ ms: 2400 }] as const;

type Source = "whatsapp" | "website" | "call";
const SOURCES: Source[] = ["whatsapp", "website", "call"];

/** What new orders look like, rotated through. Prices come from the notary calculator. */
const TEMPLATES = [
  { doc: "d1", from: "georgian", to: "english", pair: "KA → EN", pages: 2 },
  { doc: "d4", from: "georgian", to: "english", pair: "KA → EN", pages: 1 },
  { doc: "d3", from: "georgian", to: "german", pair: "KA → DE", pages: 1 },
  { doc: "d2", from: "russian", to: "georgian", pair: "RU → KA", pages: 2 },
] as const;

type Row = { id: number; tpl: number; status: StatusKey };
type Toast = { kind: "new"; id: number; source: Source } | { kind: "paid"; id: number; amount: number } | { kind: "status"; id: number; status: StatusKey };

type State = {
  rows: Row[];
  orders: number;
  sources: Record<Source, number>;
  nextId: number;
  fresh: number | null;
  toast: Toast | null;
};

const INITIAL: State = {
  rows: [
    { id: 1042, tpl: 0, status: "translator" },
    { id: 1041, tpl: 3, status: "notary" },
    { id: 1040, tpl: 2, status: "ready" },
    { id: 1039, tpl: 1, status: "nw" },
  ],
  orders: 124,
  sources: { whatsapp: 14, website: 10, call: 7 },
  nextId: FIRST_NEW_ID,
  fresh: null,
  toast: null,
};

function amountFor(tpl: number): number {
  const t = TEMPLATES[tpl];
  const { total } = calculateDocument(DEFAULT_PRICING, {
    from: t.from,
    to: t.to,
    pages: t.pages,
    notary: true,
    notaryForm: "notary_copy",
  });
  return Math.round(total * 100) / 100;
}

function nextStatus(s: StatusKey): StatusKey {
  return STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(s) + 1, STATUS_ORDER.length - 1)];
}

/** Moves one row on a status, and reports it. */
function advance(state: State, index: number): State {
  const row = state.rows[index];
  if (!row) return state;
  const status = nextStatus(row.status);
  const rows = state.rows.map((r, i) => (i === index ? { ...r, status } : r));
  return { ...state, rows, fresh: null, toast: { kind: "status", id: row.id, status } };
}

/** Event n of the feed: new order, its payment, then two older orders move on. */
function reduce(state: State, n: number): State {
  switch (n % 4) {
    case 0: {
      const id = state.nextId;
      const source = SOURCES[id % SOURCES.length];
      return {
        rows: [{ id, tpl: id % TEMPLATES.length, status: "nw" as StatusKey }, ...state.rows].slice(0, 4),
        orders: state.orders + 1,
        sources: { ...state.sources, [source]: state.sources[source] + 1 },
        nextId: id + 1,
        fresh: id,
        toast: { kind: "new", id, source },
      };
    }
    case 1: {
      const row = state.rows[0];
      return {
        ...advance(state, 0),
        toast: { kind: "paid", id: row.id, amount: amountFor(row.tpl) },
      };
    }
    case 2:
      return advance(state, 1);
    default:
      return advance(state, 2);
  }
}

export default function OverviewDemo() {
  const t = useTranslations("SulikoOffice");
  const { frameRef, loop, hoverProps } = useDemoLoop(TICK, 0);
  const [state, dispatch] = useReducer(reduce, INITIAL);

  // Each completed tick is one event; loop 0 is the untouched opening frame.
  useEffect(() => {
    if (loop > 0) dispatch(loop - 1);
  }, [loop]);

  const { rows, orders, sources, fresh, toast } = state;
  const topSource = Math.max(...Object.values(sources)) + 4;
  const bumpedSource = toast?.kind === "new" ? toast.source : null;

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
          <span key={orders} className={`text-[30px] leading-none text-foreground tabular-nums ${orders > INITIAL.orders ? "office-pop" : ""}`}>
            {orders}
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
          {SOURCES.map((s) => (
            <SourceRow
              key={s}
              label={t(`dash.${s}`)}
              value={sources[s]}
              width={`${(sources[s] / topSource) * 100}%`}
              bumped={bumpedSource === s}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-3.5 py-2.5 text-[13px] text-foreground">{t("dash.recent")}</div>
        {rows.map((o, i) => (
          <div
            key={o.id}
            className={`grid grid-cols-[48px_minmax(0,1fr)_58px] items-center gap-2 px-3.5 py-2 text-xs text-[#3a4466] transition-colors duration-700 sm:grid-cols-[50px_minmax(0,1fr)_64px_138px] dark:text-slate-300 ${
              i < rows.length - 1 ? "border-b border-border/60" : ""
            } ${o.id === fresh ? "bg-[#eef1fe] office-enter dark:bg-[#3b59f3]/10" : ""}`}
          >
            <span className="text-[#7a8299] dark:text-slate-400">#{o.id}</span>
            <span className="truncate">{t(`dash.${TEMPLATES[o.tpl].doc}`)}</span>
            <span>{TEMPLATES[o.tpl].pair}</span>
            <span
              key={o.status}
              className={`hidden justify-self-start truncate rounded-full px-2 py-1 sm:inline ${STATUS_CHIP[o.status]} ${
                toast && toast.id === o.id ? "office-pop" : ""
              }`}
            >
              {t(`st.${o.status}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Its own slot, so the notice never covers the list. */}
      <div className="flex h-9 items-center justify-center">
        {toast && (
          <div key={loop} className="flex items-center gap-2 rounded-full bg-[#111a3a] px-4 py-2 text-[13px] text-white shadow-lg office-enter dark:bg-white dark:text-[#111a3a]">
            <Bell className="h-4 w-4 shrink-0 text-[#8fa2ff] dark:text-suliko-default-color" />
            <span className="truncate">
              {toast.kind === "new"
                ? t("demo.feedNew", { id: `#${toast.id}`, source: t(`dash.${toast.source}`) })
                : toast.kind === "paid"
                  ? t("demo.feedPaid", { id: `#${toast.id}`, amount: `${toast.amount.toFixed(2)} ₾` })
                  : t("demo.feedStatus", { id: `#${toast.id}`, status: t(`st.${toast.status}`) })}
            </span>
          </div>
        )}
      </div>
    </DemoFrame>
  );
}

function SourceRow({ label, value, width, bumped }: { label: string; value: number; width: string; bumped: boolean }) {
  return (
    <>
      <span>{label}</span>
      <div className="h-2 overflow-hidden rounded bg-white dark:bg-white/10">
        <div className="h-2 rounded bg-[#2f9e5b] transition-[width] duration-700 ease-out office-grow" style={{ width }} />
      </div>
      <span key={value} className={`text-right tabular-nums ${bumped ? "office-pop" : ""}`}>
        {value}
      </span>
    </>
  );
}
