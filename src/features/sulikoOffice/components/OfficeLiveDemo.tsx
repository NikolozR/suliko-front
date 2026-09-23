"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Pause, Play, Plus } from "lucide-react";
import { STATUS_CHIP, STATUS_ORDER, type StatusKey } from "./tones";

/**
 * An autoplaying walkthrough of the product, drawn with invented figures.
 *
 * Deliberately not a screen recording: the real dashboard shows our own
 * bureau's revenue, profit and receivables, which must never appear on a
 * public page. The frame is exposed to assistive tech as one labelled image so
 * screen readers don't read the sample numbers out as facts; the step buttons
 * and the pause button below it stay reachable.
 *
 * It only runs while it is on screen, the tab is visible and the pointer is not
 * resting on it, and it never autoplays for people who ask for reduced motion.
 */

type Scene = "overview" | "form" | "orders" | "finance";
type Target = "newOrder" | "field0" | "field1" | "field2" | "field3" | "save" | "navFinance";

type Step = {
  scene: Scene;
  ms: number;
  /** Where the fake cursor should be during this step. */
  cursor?: Target;
  click?: boolean;
  /** How many form fields are filled in. */
  fill?: number;
  status?: StatusKey;
  /** How many payout lines are shown. */
  paid?: number;
  /** The order has been completed and counted on the overview. */
  done?: boolean;
};

const STEPS: Step[] = [
  { scene: "overview", ms: 2200 },
  { scene: "overview", ms: 900, cursor: "newOrder" },
  { scene: "overview", ms: 350, cursor: "newOrder", click: true },
  { scene: "form", ms: 750, fill: 0, cursor: "field0" },
  { scene: "form", ms: 750, fill: 1, cursor: "field1" },
  { scene: "form", ms: 750, fill: 2, cursor: "field2" },
  { scene: "form", ms: 750, fill: 3, cursor: "field3" },
  { scene: "form", ms: 1000, fill: 4, cursor: "save" },
  { scene: "form", ms: 350, fill: 4, cursor: "save", click: true },
  { scene: "orders", ms: 1100, status: "nw" },
  { scene: "orders", ms: 950, status: "paid" },
  { scene: "orders", ms: 1300, status: "translator" },
  { scene: "orders", ms: 950, status: "correcting" },
  { scene: "orders", ms: 950, status: "notary" },
  { scene: "orders", ms: 950, status: "ready" },
  { scene: "orders", ms: 1100, status: "done", cursor: "navFinance" },
  { scene: "orders", ms: 350, status: "done", cursor: "navFinance", click: true },
  { scene: "finance", ms: 650, paid: 1 },
  { scene: "finance", ms: 650, paid: 2 },
  { scene: "finance", ms: 650, paid: 3 },
  { scene: "finance", ms: 2000, paid: 4 },
  { scene: "overview", ms: 3200, done: true },
];

const SCENE_START: Record<Scene, number> = { overview: 0, form: 3, orders: 9, finance: 17 };
const PILLS: { scene: Scene; label: "stepOverview" | "stepNew" | "stepTrack" | "stepFinance" }[] = [
  { scene: "overview", label: "stepOverview" },
  { scene: "form", label: "stepNew" },
  { scene: "orders", label: "stepTrack" },
  { scene: "finance", label: "stepFinance" },
];

const BASE_ORDERS = 124;
const FIRST_NEW_ID = 1043;
/** Price after each form field is filled: document, pair, urgency, copies. */
const PRICE_BY_FILL = [null, null, 40, 60, 75] as const;

export default function OfficeLiveDemo() {
  const t = useTranslations("SulikoOffice");
  const frameRef = useRef<HTMLDivElement>(null);
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({});

  const [step, setStep] = useState(0);
  const [loop, setLoop] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [frameSize, setFrameSize] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });

  const current = STEPS[step];
  const running = playing && onScreen && pageVisible && !hovered;

  // Never autoplay for people who ask for reduced motion; the step buttons still work.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 });
    const ro = new ResizeObserver(() => setFrameSize(frame.offsetWidth));
    io.observe(frame);
    ro.observe(frame);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      if (step + 1 >= STEPS.length) {
        setLoop((l) => l + 1);
        setStep(0);
      } else {
        setStep(step + 1);
      }
    }, current.ms);
    return () => window.clearTimeout(id);
  }, [running, step, current.ms]);

  // Aim the cursor at this step's target once the scene has rendered it.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const f = frame.getBoundingClientRect();
    const el = current.cursor ? targets.current[current.cursor] : null;
    const r = el?.getBoundingClientRect();

    if (r && r.width > 0) {
      setCursor({ x: r.left - f.left + r.width * 0.55, y: r.top - f.top + r.height * 0.6, visible: true });
    } else if (current.scene === "overview" && !current.cursor) {
      setCursor({ x: f.width * 0.72, y: f.height * 0.9, visible: true });
    } else {
      setCursor((c) => ({ ...c, visible: false }));
    }
  }, [step, frameSize, current.cursor, current.scene]);

  const reg = (key: Target) => (el: HTMLElement | null) => {
    targets.current[key] = el;
  };
  const pressed = (key: Target) => current.click && current.cursor === key;

  const newId = `#${FIRST_NEW_ID + loop}`;
  const lastCompletedId = current.done ? newId : loop > 0 ? `#${FIRST_NEW_ID + loop - 1}` : null;
  const ordersThisMonth = BASE_ORDERS + loop + (current.done ? 1 : 0);

  const activeNav = current.scene === "overview" ? 0 : current.scene === "finance" ? 4 : 1;
  const title =
    current.scene === "overview"
      ? t("dash.title")
      : current.scene === "form"
        ? t("demo.newOrder")
        : current.scene === "orders"
          ? t("dash.navOrders")
          : t("demo.financeTitle");

  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-4 rounded-[28px] bg-[#f4f6fd] sm:-inset-7 dark:bg-white/[0.04]" />

      <div
        ref={frameRef}
        role="img"
        aria-label={t("demo.label")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex overflow-hidden rounded-[18px] border border-border bg-background shadow-[0_30px_60px_-30px_rgba(17,40,156,0.28)]"
      >
        {/* Sidebar */}
        <div aria-hidden className="hidden w-[150px] shrink-0 flex-col gap-1 border-r border-border bg-[#f7f8fc] px-3 py-5 sm:flex dark:bg-white/[0.03]">
          <div className="px-2 pb-4 text-[13px] text-foreground">Suliko Office</div>
          {[t("dash.title"), t("dash.navOrders"), t("dash.navClients"), t("dash.navTranslators"), t("dash.navFinance"), t("dash.navReports")].map(
            (item, i) => (
              <div
                key={item}
                ref={i === 4 ? reg("navFinance") : undefined}
                className={`rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-300 ${
                  i === activeNav
                    ? "bg-[#eef1fe] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]"
                    : "text-muted-foreground"
                } ${i === 4 && pressed("navFinance") ? "bg-[#eef1fe] dark:bg-[#3b59f3]/20" : ""}`}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Main panel: fixed height so the page never jumps as scenes change. */}
        <div aria-hidden className="relative flex h-[500px] min-w-0 grow flex-col gap-3.5 p-4 sm:h-[548px] sm:px-[22px] sm:pt-5 sm:pb-[22px]">
          <div className="flex h-8 items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span key={title} className="text-[17px] text-foreground office-fade">
                {title}
              </span>
              {current.scene === "overview" && (
                <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{t("dash.month")}</span>
              )}
            </div>
            {current.scene === "overview" && (
              <span
                ref={reg("newOrder")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg bg-suliko-default-color px-3 text-xs text-white transition-transform duration-150 ${
                  pressed("newOrder") ? "scale-95" : ""
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("demo.newOrder")}
              </span>
            )}
          </div>

          <div key={current.scene} className="flex min-h-0 grow flex-col gap-3.5 office-enter">
            {current.scene === "overview" && (
              <OverviewScene t={t} orders={ordersThisMonth} completedId={lastCompletedId} highlight={!!current.done} />
            )}
            {current.scene === "form" && <FormScene t={t} fill={current.fill ?? 0} reg={reg} savePressed={!!pressed("save")} />}
            {current.scene === "orders" && <OrdersScene t={t} id={newId} status={current.status ?? "nw"} />}
            {current.scene === "finance" && <FinanceScene t={t} id={newId} paid={current.paid ?? 0} />}
          </div>

          {current.done && (
            <div className="absolute inset-x-4 bottom-4 flex justify-center sm:inset-x-[22px] sm:bottom-[22px]">
              <div className="flex items-center gap-2 rounded-full bg-[#111a3a] px-4 py-2.5 text-[13px] text-white shadow-lg office-enter dark:bg-white dark:text-[#111a3a]">
                <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                {t("demo.completed", { id: newId })}
              </div>
            </div>
          )}
        </div>

        <FakeCursor x={cursor.x} y={cursor.y} visible={cursor.visible} clicking={!!current.click} />
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-5">
        <div role="group" aria-label={t("demo.steps")} className="flex flex-wrap gap-1.5">
          {PILLS.map(({ scene, label }) => {
            const active = current.scene === scene;
            return (
              <button
                key={scene}
                type="button"
                aria-pressed={active}
                onClick={() => setStep(SCENE_START[scene])}
                className={`h-10 rounded-full px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-suliko-default-color text-white"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`demo.${label}`)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("dash.sample")}</span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t("demo.pause") : t("demo.play")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-accent"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  );
}

type T = ReturnType<typeof useTranslations<"SulikoOffice">>;

function OverviewScene({ t, orders, completedId, highlight }: { t: T; orders: number; completedId: string | null; highlight: boolean }) {
  const sources = [
    { label: t("dash.whatsapp"), value: 14, width: "100%" },
    { label: t("dash.website"), value: 10, width: "71%" },
    { label: t("dash.call"), value: 7, width: "50%" },
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

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#eef1fe] px-4 py-3.5 dark:bg-[#3b59f3]/15">
          <span className="text-xs text-[#3a4466] dark:text-slate-300">{t("dash.kOrders")}</span>
          <span
            key={orders}
            className={`text-[30px] leading-none text-foreground ${highlight ? "office-pop" : ""}`}
          >
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
            } ${highlight && i === 0 ? "bg-[#eef1fe] office-fade dark:bg-[#3b59f3]/10" : ""}`}
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
    </>
  );
}

function FormScene({
  t,
  fill,
  reg,
  savePressed,
}: {
  t: T;
  fill: number;
  reg: (key: Target) => (el: HTMLElement | null) => void;
  savePressed: boolean;
}) {
  const fields = [
    { label: t("demo.fDoc"), value: t("dash.d1") },
    { label: t("demo.fPair"), value: "KA → EN" },
    { label: t("demo.fUrgency"), value: t("demo.vUrgent") },
    { label: t("demo.fCopies"), value: t("demo.vCopies") },
  ];
  const price = PRICE_BY_FILL[fill];
  // How the price was reached, one line per field that affects it.
  const breakdown = [
    { show: fill >= 2, label: t("demo.basePrice"), amount: "40 ₾" },
    { show: fill >= 3, label: t("demo.vUrgent"), amount: "+20 ₾" },
    { show: fill >= 4, label: t("demo.extraCopy"), amount: "+15 ₾" },
  ];

  return (
    <>
      <div className="rounded-xl border border-border px-3.5 py-3">
        <div className="text-xs text-muted-foreground">{t("demo.fClient")}</div>
        <div className="mt-1.5 flex h-5 items-center text-sm text-foreground">{t("demo.clientValue")}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => {
          const filled = i < fill;
          const active = i === fill;
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
                {filled ? (
                  <span className="office-slide">{f.value}</span>
                ) : (
                  <span className="h-3 w-16 rounded bg-muted" />
                )}
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
          <span key={price ?? "none"} className="text-[32px] leading-none text-foreground office-pop">
            {price ?? 0} ₾
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

      <div className="mt-auto flex justify-end">
        <span
          ref={reg("save")}
          className={`inline-flex h-10 items-center rounded-lg bg-suliko-default-color px-5 text-sm text-white transition-[transform,opacity] duration-150 ${
            fill < 4 ? "opacity-50" : ""
          } ${savePressed ? "scale-95" : ""}`}
        >
          {t("demo.save")}
        </span>
      </div>
    </>
  );
}

function OrdersScene({ t, id, status }: { t: T; id: string; status: StatusKey }) {
  const reached = STATUS_ORDER.indexOf(status);
  const others: { id: string; doc: string; pair: string; status: StatusKey }[] = [
    { id: "#1042", doc: t("dash.d1"), pair: "KA → EN", status: "translator" },
    { id: "#1041", doc: t("dash.d2"), pair: "RU → KA", status: "notary" },
    { id: "#1040", doc: t("dash.d3"), pair: "KA → DE", status: "ready" },
    { id: "#1039", doc: t("dash.d4"), pair: "KA → FR", status: "paid" },
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border">
      <div className="flex flex-col gap-2.5 bg-[#eef1fe] px-3.5 py-3.5 dark:bg-[#3b59f3]/10">
        <OrderLine id={id} doc={t("dash.d1")} pair="KA → EN" />
        <div className="flex flex-wrap items-center gap-2">
          <span
            key={status}
            className={`rounded-full px-2.5 py-1 text-xs office-pop ${STATUS_CHIP[status]}`}
          >
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
  );
}

function OrderLine({ id, doc, pair }: { id: string; doc: string; pair: string }) {
  return (
    <div className="grid grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-2 text-xs text-[#3a4466] dark:text-slate-300">
      <span className="text-[#7a8299] dark:text-slate-400">{id}</span>
      <span className="truncate text-foreground">{doc}</span>
      <span>{pair}</span>
    </div>
  );
}

function FinanceScene({ t, id, paid }: { t: T; id: string; paid: number }) {
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
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <OrderLine id={id} doc={t("dash.d1")} pair="KA → EN" />
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
    </>
  );
}

function SourceRow({ label, value, width }: { label: string; value: number; width: string }) {
  return (
    <>
      <span>{label}</span>
      <div className="h-2 rounded bg-white dark:bg-white/10">
        <div className="h-2 rounded bg-[#2f9e5b]" style={{ width }} />
      </div>
      <span className="text-right">{value}</span>
    </>
  );
}

function FakeCursor({ x, y, visible, clicking }: { x: number; y: number; visible: boolean; clicking: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-10 transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none"
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: visible ? 1 : 0 }}
    >
      {clicking && (
        <span className="absolute -top-3 -left-3 h-6 w-6 animate-ping rounded-full bg-suliko-default-color/40 motion-reduce:animate-none" />
      )}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        className={`drop-shadow-md transition-transform duration-150 ${clicking ? "scale-90" : ""}`}
      >
        <path d="M4 2.5 19.5 12l-7 1.6L9 20.5z" fill="#111a3a" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
