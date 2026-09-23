import { useTranslations } from "next-intl";
import { STATUS_CHIP, type StatusKey } from "./tones";

/**
 * A drawn stand-in for the product dashboard, with invented figures.
 *
 * Deliberately not a screenshot: the real dashboard shows our own bureau's
 * revenue, profit and receivables, which must never appear on a public page.
 * Exposed to assistive tech as a single labelled image so screen readers don't
 * read the sample numbers out as if they were facts.
 */
export default function DashboardMockup() {
  const t = useTranslations("SulikoOffice");

  const sources = [
    { label: t("dash.whatsapp"), value: 14, width: "100%" },
    { label: t("dash.website"), value: 10, width: "71%" },
    { label: t("dash.call"), value: 7, width: "50%" },
  ];

  const orders: { id: string; doc: string; pair: string; status: StatusKey }[] = [
    { id: "#1042", doc: t("dash.d1"), pair: "KA → EN", status: "translator" },
    { id: "#1041", doc: t("dash.d2"), pair: "RU → KA", status: "notary" },
    { id: "#1040", doc: t("dash.d3"), pair: "KA → DE", status: "ready" },
    { id: "#1039", doc: t("dash.d4"), pair: "KA → FR", status: "nw" },
  ];

  const nav = [t("dash.navOrders"), t("dash.navClients"), t("dash.navTranslators"), t("dash.navFinance"), t("dash.navReports")];

  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-4 rounded-[28px] bg-[#f4f6fd] sm:-inset-7 dark:bg-white/[0.04]" />
      <div
        role="img"
        aria-label={t("dash.label")}
        className="relative flex overflow-hidden rounded-[18px] border border-border bg-background shadow-[0_30px_60px_-30px_rgba(17,40,156,0.28)]"
      >
        <div aria-hidden className="hidden w-[150px] shrink-0 flex-col gap-1 border-r border-border bg-[#f7f8fc] px-3 py-5 sm:flex dark:bg-white/[0.03]">
          <div className="px-2 pb-4 text-[13px] text-foreground">Suliko Office</div>
          <div className="rounded-lg bg-[#eef1fe] px-2.5 py-2 text-[13px] text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]">
            {t("dash.title")}
          </div>
          {nav.map((item) => (
            <div key={item} className="px-2.5 py-2 text-[13px] text-muted-foreground">
              {item}
            </div>
          ))}
        </div>

        <div aria-hidden className="flex min-w-0 grow flex-col gap-3.5 p-4 sm:px-[22px] sm:pt-5 sm:pb-[22px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[17px] text-foreground">{t("dash.title")}</span>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{t("dash.month")}</span>
            </div>
            <span className="rounded-md bg-[#fff4d9] px-2 py-1 text-[11px] text-[#6b5200] dark:bg-amber-400/15 dark:text-amber-200">
              {t("dash.sample")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 rounded-xl bg-[#eef1fe] px-4 py-3.5 dark:bg-[#3b59f3]/15">
              <span className="text-xs text-[#3a4466] dark:text-slate-300">{t("dash.kOrders")}</span>
              <span className="text-[30px] leading-none text-foreground">124</span>
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
            {orders.map((o, i) => (
              <div
                key={o.id}
                className={`grid grid-cols-[44px_minmax(0,1fr)_58px] items-center gap-2 px-3.5 py-2 text-xs text-[#3a4466] sm:grid-cols-[50px_minmax(0,1fr)_64px_138px] dark:text-slate-300 ${
                  i < orders.length - 1 ? "border-b border-border/60" : ""
                }`}
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
        </div>
      </div>
    </div>
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
