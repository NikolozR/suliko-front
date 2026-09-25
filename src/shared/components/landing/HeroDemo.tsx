"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, FileText } from "lucide-react";
import { useAutoplay, useTicker } from "./useAutoplay";

/**
 * The hero's product demo, drawn in code instead of the MP4 it replaced: a
 * contract uploads, its segments translate one at a time (Georgian on one
 * loop, Polish on the next), then the export buttons appear.
 *
 * The contract is demo content, so it stays here rather than in messages/;
 * only the editor's own labels are translated.
 */

const SOURCE = [
  "SERVICE AGREEMENT",
  "This Agreement is made between the Client and the Contractor.",
  "1. Subject of the Agreement",
  "The Contractor shall translate the documents listed in Annex 1.",
  "2. Payment terms",
  "Payment is due within 10 business days of delivery.",
];

const TARGETS = [
  {
    code: "KA",
    language: "georgian",
    lines: [
      "მომსახურების ხელშეკრულება",
      "წინამდებარე ხელშეკრულება იდება დამკვეთსა და შემსრულებელს შორის.",
      "1. ხელშეკრულების საგანი",
      "შემსრულებელი თარგმნის დანართ 1-ში ჩამოთვლილ დოკუმენტებს.",
      "2. ანაზღაურების პირობები",
      "ანაზღაურება ხორციელდება ჩაბარებიდან 10 სამუშაო დღის ვადაში.",
    ],
  },
  {
    code: "PL",
    language: "polish",
    lines: [
      "UMOWA O ŚWIADCZENIE USŁUG",
      "Niniejsza Umowa zostaje zawarta pomiędzy Zleceniodawcą a Wykonawcą.",
      "1. Przedmiot Umowy",
      "Wykonawca przetłumaczy dokumenty wymienione w Załączniku 1.",
      "2. Warunki płatności",
      "Płatność następuje w ciągu 10 dni roboczych od dostarczenia.",
    ],
  },
] as const;

/** Headings are the short lines; the rest are body text. */
const HEADING = [true, false, true, false, true, false];
/** Skeleton widths while a segment waits its turn. */
const SKELETON = ["58%", "94%", "48%", "90%", "52%", "96%"];

/** Ticks spent uploading, then one per segment, then a hold on the finished page. */
const UPLOAD_TICKS = 3;
const LAST_TICK = 17;
const TICK_MS = 620;

export default function HeroDemo() {
  const t = useTranslations("HeroDemo");
  const { ref, running, reducedMotion } = useAutoplay<HTMLDivElement>();
  const [tick, setTick] = useState(0);
  const [loop, setLoop] = useState(0);
  const [host, setHost] = useState("suliko.ge");

  useEffect(() => {
    const h = window.location.hostname;
    if (h.endsWith(".io")) setHost("suliko.io");
    else if (h.endsWith(".ai")) setHost("suliko.ai");
  }, []);

  useTicker(running, TICK_MS, () => {
    if (tick >= LAST_TICK) {
      setTick(0);
      setLoop((l) => l + 1);
    } else {
      setTick(tick + 1);
    }
  });

  // Reduced motion: show the finished page and nothing else.
  const step = reducedMotion ? LAST_TICK : tick;
  const target = TARGETS[loop % TARGETS.length];
  const total = SOURCE.length;
  const done = Math.max(0, Math.min(total, step - UPLOAD_TICKS));
  const uploading = step < UPLOAD_TICKS;
  const finished = step > UPLOAD_TICKS + total;

  const status = uploading
    ? t("uploading")
    : finished
      ? t("done")
      : t("translating", { done, total });

  return (
    <div
      ref={ref}
      data-paused={!running || undefined}
      role="img"
      aria-label={t("ariaLabel")}
      className="relative w-full overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
    >
      {/* Browser chrome */}
      <div aria-hidden="true" className="flex items-center gap-3 bg-slate-900 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex h-5 flex-1 items-center overflow-hidden rounded-full bg-white/[0.07] px-3">
          <span className="truncate text-xs text-slate-400">{host}/document</span>
        </div>
      </div>

      <div aria-hidden="true">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <FileText className="h-4 w-4 shrink-0 text-suliko-default-color" />
          <span className="truncate text-sm font-semibold">service_agreement.pdf</span>
          <span className="shrink-0 rounded-full bg-[#eef1fe] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#2f49d6]">
            EN → {target.code}
          </span>
          <span className="flex-1" />
          <span className="hidden shrink-0 text-xs tabular-nums text-slate-500 sm:inline">{status}</span>
          <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-200 sm:w-24">
            <span
              className="block h-full rounded-full bg-suliko-default-color transition-[width] duration-500 ease-out"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </span>
        </div>

        {/* Split view: original | translation */}
        <div className="grid h-[330px] grid-cols-1 sm:h-[372px] sm:grid-cols-2">
          <div className="hidden flex-col gap-1 border-r border-slate-200 bg-[#fbfcff] p-3 sm:flex">
            <span className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-slate-400">
              {t("original")}
            </span>
            {SOURCE.map((line, i) => (
              <p
                key={i}
                className={`rounded-lg px-2 py-2 text-[13px] leading-snug transition-colors duration-300 ${
                  HEADING[i] ? "font-semibold" : ""
                } ${step === UPLOAD_TICKS + i ? "bg-[#eef1fe]" : ""}`}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-1 p-3">
            <span className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-slate-400">
              {t("translation", { language: t(target.language) })}
            </span>
            {target.lines.map((line, i) => {
              const active = step === UPLOAD_TICKS + i;
              const isDone = step > UPLOAD_TICKS + i;
              return (
                <div
                  key={i}
                  className={`rounded-lg px-2 py-2 transition-colors duration-300 ${
                    HEADING[i] ? "min-h-[36px]" : "min-h-[54px]"
                  } ${active ? "bg-[#eef1fe]" : ""}`}
                >
                  {isDone ? (
                    <p
                      key={`${loop}-${i}`}
                      className={`lp-enter text-[13px] leading-snug ${HEADING[i] ? "font-semibold" : ""}`}
                    >
                      {line}
                    </p>
                  ) : (
                    <span className="flex h-[18px] items-center gap-1.5">
                      <span
                        className={`h-2.5 rounded-md ${active ? "lp-shimmer" : "bg-slate-100"}`}
                        style={{ width: SKELETON[i] }}
                      />
                      {active && <span className="lp-caret h-4 w-0.5 bg-suliko-default-color" />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: hint while working, export once done */}
        <div className="flex h-14 items-center gap-2 border-t border-slate-200 px-4 sm:px-5">
          {finished ? (
            <>
              <span className="lp-pop flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-4 w-4" strokeWidth={2.5} />
                {t("layoutPreserved")}
              </span>
              <span className="flex-1" />
              <span
                className="lp-pop hidden rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold sm:inline-block"
                style={{ animationDelay: "120ms" }}
              >
                {t("exportPdf")}
              </span>
              <span
                className="lp-pop rounded-lg bg-suliko-default-color px-3 py-1.5 text-xs font-semibold text-white"
                style={{ animationDelay: "220ms" }}
              >
                {t("exportDocx")}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">{t("reviewHint")}</span>
          )}
        </div>

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-x-0 bottom-0 top-[46px] flex items-center justify-center bg-[#f8faff]/95 px-6">
            <div className="lp-pop w-full max-w-[320px] space-y-3.5 rounded-2xl border-2 border-dashed border-[#9fb0f8] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[10px] font-bold text-red-700">
                  PDF
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">service_agreement.pdf</p>
                  <p className="text-xs text-slate-500">{t("readingLayout")}</p>
                </div>
              </div>
              <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-suliko-default-color transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, (step + 1) * 34)}%` }}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
