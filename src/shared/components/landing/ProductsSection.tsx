"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { STATUS_CHIP, type StatusKey } from "@/features/sulikoOffice/components/tones";
import { useAutoplay, useTicker } from "./useAutoplay";

/** New orders arrive at the top; older ones have moved further along. */
const FEED: { doc: string; pair: string }[] = [
  { doc: "d1", pair: "KA → EN" },
  { doc: "d2", pair: "RU → KA" },
  { doc: "d3", pair: "KA → DE" },
  { doc: "d4", pair: "KA → EN" },
];
const ROW_STATUS: StatusKey[] = ["nw", "translator", "notary", "ready"];
const FIRST_ID = 1042;

/** The preview card stays white in dark mode, so its chips keep their light tones. */
const lightChip = (status: StatusKey) =>
  STATUS_CHIP[status]
    .split(" ")
    .filter((c) => !c.startsWith("dark:"))
    .join(" ");
const FIRST_COUNT = 124;

/**
 * Suliko Office and notarised translation side by side, each with a small
 * live preview: orders arriving in the Office feed, a stamp landing on a page.
 * Replaces the separate OfficePromo and NotaryPromo bands on the landing.
 */
export default function ProductsSection() {
  const t = useTranslations("Products");
  const tOffice = useTranslations("OfficePromo");
  const tNotary = useTranslations("NotaryPromo");
  const tSo = useTranslations("SulikoOffice");
  const { ref, running } = useAutoplay<HTMLElement>();
  const [arrived, setArrived] = useState(0);

  useTicker(running, 2400, () => setArrived((n) => n + 1));

  const rows = ROW_STATUS.map((status, k) => {
    const id = FIRST_ID + arrived - k;
    return { id, status, ...FEED[id % FEED.length] };
  });

  return (
    <section ref={ref} data-paused={!running || undefined} className="bg-background py-20 sm:py-24">
      <div className="container mx-auto flex flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div data-reveal className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-[0.08em] text-suliko-default-color uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{t("title")}</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Suliko Office */}
          <article
            data-reveal
            className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-[#dbe2f5] bg-[#f2f5ff] p-6 sm:grid-cols-[minmax(0,1fr)_260px] sm:p-7 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                <span className="self-start rounded-full bg-suliko-default-color px-2.5 py-1 text-xs font-semibold text-white">
                  Suliko Office
                </span>
                <h3 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">{tOffice("heading")}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{tOffice("subheading")}</p>
              </div>
              <Link
                href="/tms"
                className="group inline-flex items-center gap-2 self-start rounded-xl bg-suliko-default-color px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-suliko-default-hover-color"
              >
                {tOffice("cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>

            <div
              aria-hidden="true"
              className="flex flex-col gap-2 self-center rounded-2xl border border-[#dbe2f5] bg-white p-3.5 text-slate-900 dark:border-slate-700"
            >
              <div className="flex items-center text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                <span className="flex-1">{t("ordersToday")}</span>
                <span className="text-base tracking-normal text-slate-900 tabular-nums">{FIRST_COUNT + arrived}</span>
              </div>
              {rows.map((r, k) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] ${
                    k === 0 && arrived > 0 ? "lp-enter bg-[#eef1fe]" : "bg-slate-50"
                  }`}
                >
                  <span className="font-mono text-slate-500">#{r.id}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{tSo(`dash.${r.doc}`)}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${lightChip(r.status)}`}>
                    {tSo(`st.${r.status}`)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* Notary */}
          <article
            data-reveal
            className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:grid-cols-[minmax(0,1fr)_220px] sm:p-7 dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
            style={{ ["--reveal-delay" as string]: "100ms" }}
          >
            <div className="flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                <span className="self-start rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                  {t("notaryTag")}
                </span>
                <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">{tNotary("heading")}</h3>
                <p className="text-[15px] leading-relaxed text-slate-300">{tNotary("subheading")}</p>
              </div>
              <Link
                href="/notary"
                className="group inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-[15px] font-semibold text-[#11289c] transition-colors hover:bg-blue-50"
              >
                {t("notaryCta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>

            <div
              aria-hidden="true"
              className="relative flex flex-col gap-2.5 self-center rounded-xl bg-white px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
            >
              <span className="block h-2 w-[60%] rounded bg-slate-300" />
              {["94%", "88%", "76%", "90%", "58%"].map((w, i) => (
                <span key={i} className="block h-1.5 rounded bg-slate-200" style={{ width: w }} />
              ))}
              <svg width="130" height="40" viewBox="0 0 130 40" className="mt-4">
                <path
                  className="lp-sign"
                  d="M4 28c10-18 18-20 20-6s8 10 16-6 12-6 12 4 10 2 18-8 10 0 14 8 16-2 22-10 14 4 20 6"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="lp-ink absolute right-4 bottom-5 flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-suliko-default-color/75">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-suliko-default-color/75 text-center font-mono text-[9px] leading-tight font-medium tracking-[0.08em] text-[#2f49d6]">
                  NOTARY
                  <br />
                  CERTIFIED
                </span>
              </span>
              <span className="lp-stamp absolute right-5 bottom-6 h-[76px] w-[76px] rounded-full bg-suliko-default-color shadow-[0_10px_22px_rgba(0,0,0,0.3)]" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
