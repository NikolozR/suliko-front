"use client";

import { useTranslations } from "next-intl";
import { FileCheck2, FileText, Lock } from "lucide-react";
import { useAutoplay } from "./useAutoplay";

const OUTER_ORBIT = ["ქართ", "EN", "PL", "FR"];
const INNER_ORBIT = ["UA", "TR", "AR"];
const GEORGIAN_A = "ა ბ გ დ ე ვ ზ თ ი კ ლ მ ნ ო პ ჟ რ ს ტ";
const GEORGIAN_B = "უ ფ ქ ღ ყ შ ჩ ც ძ წ ჭ ხ ჯ ჰ";

/** Places `count` chips evenly on a circle of `radius` px around the centre. */
function onCircle(i: number, count: number, radius: number) {
  const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
  return { left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)` };
}

/**
 * "Why Suliko" as a bento of four tiles, each with its own small CSS loop:
 * a segment typing itself with suggestions, languages in orbit, Georgian
 * script drifting past, and a file travelling through encryption.
 * Keeps the #about id the header and footer link to.
 */
export default function FeaturesSection() {
  const t = useTranslations("Features");
  const { ref, running } = useAutoplay<HTMLElement>();

  return (
    <section
      id="about"
      ref={ref}
      data-paused={!running || undefined}
      className="scroll-mt-24 bg-background py-20 sm:py-24"
    >
      <div className="container mx-auto flex flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div data-reveal className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="font-mono text-xs tracking-[0.08em] text-suliko-default-color uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{t("title")}</h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-[minmax(360px,auto)_minmax(300px,auto)]">
          {/* Copilot */}
          <article
            data-reveal
            className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-[#dbe2f5] bg-[#f2f5ff] p-6 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:p-7 md:col-span-2 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex flex-col justify-end gap-2">
              <h3 className="text-xl font-bold text-foreground">{t("copilot.title")}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{t("copilot.body")}</p>
            </div>
            <div
              aria-hidden="true"
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#dbe2f5] bg-white p-5 text-slate-900 dark:border-slate-700"
            >
              <div className="flex text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                <span className="flex-1">{t("copilot.segment")}</span>
                <span className="text-[#2f49d6]">EN → KA</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Payment is due within 10 business days of delivery.
              </p>
              <span className="h-px bg-slate-100" />
              <p className="lp-type overflow-hidden whitespace-nowrap text-[15px] leading-relaxed">
                ანაზღაურება ხორციელდება ჩაბარებიდან 10 სამუშაო დღეში.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="lp-chip rounded-lg bg-[#eef1fe] px-2.5 py-1.5 text-xs font-semibold text-[#2f49d6]">
                  {t("copilot.glossary")} · ანაზღაურება
                </span>
                <span
                  className="lp-chip rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
                  style={{ animationDelay: "150ms" }}
                >
                  {t("copilot.consistent")}
                </span>
              </div>
            </div>
          </article>

          {/* Languages */}
          <article
            data-reveal
            className="relative flex min-h-[360px] flex-col justify-end gap-2 overflow-hidden rounded-3xl border border-[#dbe2f5] bg-[#f2f5ff] p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900/60"
            style={{ ["--reveal-delay" as string]: "100ms" }}
          >
            <div aria-hidden="true" className="absolute left-1/2 top-[124px] h-0 w-0">
              <div className="lp-orbit absolute -left-[90px] -top-[90px] h-[180px] w-[180px] rounded-full border border-dashed border-[#b3c0f7] dark:border-slate-600">
                {OUTER_ORBIT.map((code, i) => (
                  <span key={code} className="absolute -translate-x-1/2 -translate-y-1/2" style={onCircle(i, OUTER_ORBIT.length, 90)}>
                    <span className="lp-orbit-counter inline-block rounded-full border border-[#dbe2f5] bg-white px-2.5 py-1 text-xs font-semibold text-slate-900">
                      {code}
                    </span>
                  </span>
                ))}
              </div>
              <div className="lp-orbit-inner absolute -left-[52px] -top-[52px] h-[104px] w-[104px] rounded-full border border-dashed border-[#cdd6fa] dark:border-slate-700">
                {INNER_ORBIT.map((code, i) => (
                  <span key={code} className="absolute -translate-x-1/2 -translate-y-1/2" style={onCircle(i, INNER_ORBIT.length, 52)}>
                    <span className="lp-orbit-inner-counter inline-block rounded-full bg-suliko-default-color px-2 py-0.5 text-[11px] font-semibold text-white">
                      {code}
                    </span>
                  </span>
                ))}
              </div>
              <span className="absolute -left-6 -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">
                S
              </span>
            </div>
            <h3 className="relative text-xl font-bold text-foreground">{t("languages.title")}</h3>
            <p className="relative text-[15px] leading-relaxed text-muted-foreground">{t("languages.body")}</p>
          </article>

          {/* Georgian */}
          <article
            data-reveal
            className="relative flex min-h-[300px] flex-col justify-end gap-2 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-7 dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-7 flex flex-col gap-1.5 text-5xl leading-tight font-bold whitespace-nowrap"
            >
              <div className="lp-marquee flex w-max" style={{ ["--lp-marquee" as string]: "26s" }}>
                <span className="pr-6">{GEORGIAN_A}</span>
                <span className="pr-6">{GEORGIAN_A}</span>
              </div>
              <div className="lp-marquee-reverse flex w-max text-[#5b73f5]" style={{ ["--lp-marquee" as string]: "32s" }}>
                <span className="pr-6">{GEORGIAN_B}</span>
                <span className="pr-6">{GEORGIAN_B}</span>
              </div>
            </div>
            <h3 className="relative text-xl font-bold text-white">{t("georgian.title")}</h3>
            <p className="relative text-[15px] leading-relaxed text-slate-300">{t("georgian.body")}</p>
          </article>

          {/* Privacy */}
          <article
            data-reveal
            className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-[#dbe2f5] bg-[#f2f5ff] p-6 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:p-7 md:col-span-2 dark:border-slate-800 dark:bg-slate-900/60"
            style={{ ["--reveal-delay" as string]: "100ms" }}
          >
            <div className="flex flex-col justify-end gap-2">
              <h3 className="text-xl font-bold text-foreground">{t("privacy.title")}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{t("privacy.body")}</p>
            </div>
            <div aria-hidden="true" className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-[72px] w-14 items-center justify-center rounded-xl border border-[#dbe2f5] bg-white text-suliko-default-color dark:border-slate-700">
                  <FileText className="h-6 w-6" />
                </span>
                <span className="text-xs text-muted-foreground">{t("privacy.yourFile")}</span>
              </div>
              <Track delay="0ms" />
              <div className="flex flex-col items-center gap-2">
                <span className="relative flex h-[72px] w-[72px] items-center justify-center">
                  <span className="lp-pulse absolute inset-0 rounded-full bg-suliko-default-color/25" />
                  <span className="lp-pulse absolute inset-0 rounded-full bg-suliko-default-color/25" style={{ animationDelay: "1.1s" }} />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-suliko-default-color text-white">
                    <Lock className="h-6 w-6" />
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{t("privacy.encrypted")}</span>
              </div>
              <Track delay="900ms" />
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-[72px] w-14 items-center justify-center rounded-xl border border-[#dbe2f5] bg-white text-emerald-700 dark:border-slate-700">
                  <FileCheck2 className="h-6 w-6" />
                </span>
                <span className="text-xs text-muted-foreground">{t("privacy.onlyYou")}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/** A dashed line with a dot travelling along it. */
function Track({ delay }: { delay: string }) {
  return (
    <span className="relative mx-2 block h-0.5 w-16 bg-[repeating-linear-gradient(90deg,#b3c0f7_0_6px,transparent_6px_12px)] sm:mx-3 sm:w-32">
      <span
        className="lp-travel absolute -top-1 left-0 h-2.5 w-2.5 rounded-full bg-suliko-default-color"
        style={{ animationDelay: delay }}
      />
    </span>
  );
}
