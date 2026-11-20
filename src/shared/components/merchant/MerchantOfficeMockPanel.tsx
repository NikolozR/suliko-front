/**
 * A static "live screen" for the dark Office section — the same glassy, colour-coded look the
 * promo video builds in 3D for its UI shots, done here in flat HTML so it reads instantly. Not a
 * real screenshot: demo data, like everywhere else on this page and in the video.
 */
import { useTranslations } from "next-intl";

const ROWS = [
  { icon: "blue", doc: "serviceAgreement", pair: "EN → DE", status: "beingNotarised", tone: "amber", who: "Jonas W." },
  { icon: "coral", doc: "powerOfAttorney", pair: "FR → EN", status: "completed", tone: "emerald", who: "Marta L." },
  { icon: "amber", doc: "birthCertificate", pair: "EN → ES", status: "readyForPickup", tone: "blue", who: "Nino K." },
  { icon: "blue", doc: "diplomaSupplement", pair: "PL → EN", status: "withTranslator", tone: "slate", who: "Nino K." },
] as const;

const ICON: Record<string, string> = {
  blue: "from-[#5a74ff] to-[#2a41c4]",
  coral: "from-[#ff8a68] to-[#c9482a]",
  amber: "from-[#ffd65c] to-[#c98a06]",
};
const TONE: Record<string, string> = {
  amber: "bg-amber-400/15 text-amber-300 ring-amber-400/25",
  emerald: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/25",
  blue: "bg-blue-400/15 text-blue-300 ring-blue-400/25",
  slate: "bg-white/10 text-white/60 ring-white/15",
};

export default function MerchantOfficeMockPanel() {
  const t = useTranslations("Merchant.office.mock");
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] backdrop-blur-sm">
      <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
        <div className="flex items-center gap-2.5 pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-2 text-[12.5px] font-medium text-white/45">{t("title")}</span>
          <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {t("month")}
          </span>
        </div>

        <div className="space-y-2">
          {ROWS.map((r) => (
            <div
              key={r.doc}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br text-[10px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(0,0,0,.5)] ${ICON[r.icon]}`}
              >
                {Array.from(t(r.doc))[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium text-white/90">{t(r.doc)}</div>
                <div className="text-[11.5px] text-white/45">{r.pair}</div>
              </div>
              <span
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 sm:inline-block ${TONE[r.tone]}`}
              >
                {t(r.status)}
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 text-[12px] text-white/55 md:flex">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-white/70">
                  {r.who[0]}
                </span>
                {r.who}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
