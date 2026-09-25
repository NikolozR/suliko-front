"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { useAutoplay, useTicker } from "./useAutoplay";

const STEPS = ["upload", "translate", "export"] as const;
const STEP_MS = 4000;

/**
 * Upload → translate & review → export, advancing by itself every few seconds
 * with a progress bar under the current step. Clicking a step jumps to it and
 * restarts the timer from there.
 */
export default function HowItWorksSection() {
  const t = useTranslations("HowItWorks");
  const { ref, running } = useAutoplay<HTMLElement>();
  const [step, setStep] = useState(0);
  // Bumped on every manual pick so the ticker and progress bar restart.
  const [round, setRound] = useState(0);

  useTicker(running, STEP_MS, () => setStep((s) => (s + 1) % STEPS.length), round);

  const pick = (i: number) => {
    setStep(i);
    setRound((r) => r + 1);
  };

  return (
    <section
      id="how-it-works"
      ref={ref}
      data-paused={!running || undefined}
      className="scroll-mt-24 bg-[#f2f5ff] py-20 dark:bg-slate-950 sm:py-24"
    >
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-20 lg:px-8">
        <div data-reveal className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs tracking-[0.08em] text-suliko-default-color uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{t("title")}</h2>
          </div>

          <div className="flex flex-col gap-2">
            {STEPS.map((key, i) => {
              const active = i === step;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(i)}
                  className={`flex flex-col gap-2 rounded-2xl border px-5 py-4 text-left transition-colors duration-300 ${
                    active
                      ? "border-[#c9d3fb] bg-white shadow-[0_10px_30px_rgba(30,50,140,0.10)] dark:border-slate-700 dark:bg-slate-900"
                      : "border-transparent hover:bg-white/60 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        active
                          ? "bg-suliko-default-color text-white"
                          : "bg-[#e3e8fb] text-[#2f49d6] dark:bg-slate-800 dark:text-blue-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-lg font-semibold text-foreground">{t(`steps.${key}.title`)}</span>
                  </span>
                  {active && (
                    <>
                      <span className="lp-enter pl-11 text-[15px] leading-relaxed text-muted-foreground">
                        {t(`steps.${key}.body`)}
                      </span>
                      <span className="ml-11 block h-[3px] overflow-hidden rounded-full bg-[#dbe2f5] dark:bg-slate-700">
                        <span
                          key={`${step}-${round}`}
                          className="lp-fill block h-full bg-suliko-default-color"
                          style={{ ["--lp-step" as string]: `${STEP_MS}ms` }}
                        />
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-reveal
          aria-hidden="true"
          className="relative h-[380px] overflow-hidden rounded-3xl border border-[#dbe2f5] bg-white text-slate-900 shadow-[0_30px_60px_rgba(30,50,140,0.12)] sm:h-[460px] dark:border-slate-700"
          style={{ ["--reveal-delay" as string]: "120ms" }}
        >
          {step === 0 && <UploadScene t={t} />}
          {step === 1 && <ReviewScene t={t} />}
          {step === 2 && <ExportScene t={t} />}
        </div>
      </div>
    </section>
  );
}

type T = ReturnType<typeof useTranslations>;

function UploadScene({ t }: { t: T }) {
  const files = [
    { label: "PDF", color: "text-red-700" },
    { label: "DOCX", color: "text-blue-700" },
    { label: "JPG", color: "text-emerald-700" },
    { label: "TXT", color: "text-slate-600" },
  ];
  return (
    <div className="absolute inset-0 p-6 sm:p-10">
      <div className="flex h-full flex-col items-center justify-center gap-7 rounded-2xl border-2 border-dashed border-[#b3c0f7] bg-[#f8f9ff]">
        <div className="flex gap-2.5 sm:gap-4">
          {files.map((f, i) => (
            <span
              key={f.label}
              className={`lp-drop flex h-20 w-16 items-end justify-center rounded-xl border border-slate-200 bg-white pb-3 text-xs font-bold shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:h-24 sm:w-20 ${f.color}`}
              style={{ animationDelay: `${i * 250}ms` }}
            >
              {f.label}
            </span>
          ))}
        </div>
        <div className="lp-hover flex flex-col items-center gap-1.5 text-center">
          <Upload className="h-7 w-7 text-suliko-default-color" />
          <span className="text-base font-semibold">{t("dropHint")}</span>
          <span className="text-sm text-slate-500">{t("formats")}</span>
        </div>
      </div>
    </div>
  );
}

function ReviewScene({ t }: { t: T }) {
  const bars = ["60%", "94%", "88%", "70%", "44%", "92%", "80%", "86%"];
  return (
    <div className="lp-enter absolute inset-0 grid grid-cols-2">
      <div className="relative flex flex-col gap-3 border-r border-slate-200 bg-[#fbfcff] px-5 py-8 sm:px-8">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">{t("original")}</span>
        {bars.map((w, i) => (
          <span
            key={i}
            className={`block rounded-md ${i === 0 || i === 4 ? "mt-1 h-3 bg-slate-300" : "h-2.5 bg-slate-200"}`}
            style={{ width: w }}
          />
        ))}
        <span
          className="lp-scan absolute inset-x-3 top-14 h-10 rounded-lg border border-suliko-default-color/35 bg-suliko-default-color/10"
          style={{ ["--lp-scan" as string]: "200px" }}
        />
      </div>
      <div className="relative flex flex-col gap-3 px-5 py-8 sm:px-8">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">{t("translation")}</span>
        <p className="text-[15px] font-semibold">მომსახურების ხელშეკრულება</p>
        <p className="text-sm leading-relaxed text-slate-700">
          შემსრულებელი{" "}
          <span className="border-b-2 border-amber-500 bg-amber-100">თარგმნის</span>{" "}
          დანართ 1-ში ჩამოთვლილ დოკუმენტებს.
        </p>
        <div
          className="lp-pop flex w-full max-w-[230px] flex-col gap-2 self-end rounded-xl border border-[#dbe2f5] bg-white p-3 shadow-[0_16px_32px_rgba(15,23,42,0.14)]"
          style={{ animationDelay: "900ms" }}
        >
          <span className="text-xs font-semibold text-[#2f49d6]">{t("suggestion")}</span>
          <span className="rounded-lg bg-[#eef1fe] px-2 py-1.5 text-[13px]">ვალდებულია თარგმნოს</span>
          <span className="rounded-lg bg-slate-50 px-2 py-1.5 text-[13px]">უზრუნველყოფს თარგმნას</span>
        </div>
        <span className="block h-2.5 w-[84%] rounded-md bg-slate-100" />
        <span className="block h-2.5 w-[72%] rounded-md bg-slate-100" />
      </div>
    </div>
  );
}

function ExportScene({ t }: { t: T }) {
  const formats = [
    { key: "formatWord", badge: "W", bg: "bg-blue-700", selected: true },
    { key: "formatPdf", badge: "PDF", bg: "bg-red-600", selected: false },
    { key: "formatTxt", badge: "TXT", bg: "bg-slate-500", selected: false },
  ] as const;
  return (
    <div className="lp-enter absolute inset-0 flex flex-col items-center justify-center gap-8 px-5">
      <div className="flex gap-3 sm:gap-4">
        {formats.map((f, i) => (
          <div
            key={f.key}
            className={`lp-pop flex w-24 flex-col items-center gap-2.5 rounded-2xl py-5 sm:w-32 ${
              f.selected ? "border-2 border-suliko-default-color bg-[#eef1fe]" : "border border-slate-200 bg-white"
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className={`flex h-14 w-11 items-center justify-center rounded-lg text-sm font-bold text-white ${f.bg}`}>
              {f.badge}
            </span>
            <span className="text-sm font-semibold">{t(f.key)}</span>
          </div>
        ))}
      </div>
      <div className="flex max-w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 sm:px-5">
        <svg width="44" height="44" viewBox="0 0 48 48" className="shrink-0">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
          <circle
            className="lp-ring"
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
          <path
            className="lp-pop"
            d="M16 24l6 6 10-12"
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animationDelay: "1.9s", transformOrigin: "center" }}
          />
        </svg>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">service_agreement_KA.docx</p>
          <p className="text-[13px] text-slate-500">{t("exportNote")}</p>
        </div>
      </div>
    </div>
  );
}
