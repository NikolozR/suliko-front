import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { CONTAINER, KICKER, STATUS_CHIP, STATUS_ORDER } from "./tones";

/** One order walked through its statuses: a row on desktop, a column on phones. */
export default function OfficeJourney() {
  const t = useTranslations("SulikoOffice");

  return (
    <section id="journey" className={`${CONTAINER} flex scroll-mt-24 flex-col gap-12 py-20 lg:pt-[104px] lg:pb-24`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex max-w-[760px] flex-col gap-3.5">
          <p className={KICKER}>{t("journey.kicker")}</p>
          <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("journey.title")}</h2>
          <p className="text-lg leading-[1.55] text-muted-foreground">{t("journey.sub")}</p>
        </div>
        <span className="self-start rounded-[10px] border border-dashed border-border px-3.5 py-2.5 text-sm text-[#3a4466] lg:shrink-0 lg:self-auto dark:text-slate-300">
          {t("journey.order")}
        </span>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute top-3.5 bottom-3.5 left-[13px] w-0.5 bg-[#dfe4f2] lg:top-[13px] lg:right-3.5 lg:bottom-auto lg:left-3.5 lg:h-0.5 lg:w-auto dark:bg-white/10"
        />
        <ol className="relative grid gap-7 lg:grid-cols-7 lg:gap-4">
          {STATUS_ORDER.map((key, i) => {
            const last = i === STATUS_ORDER.length - 1;
            return (
              <li key={key} className="flex gap-4 lg:flex-col lg:gap-3.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-suliko-default-color text-xs ${
                    last ? "bg-suliko-default-color text-white" : "bg-background text-suliko-default-color dark:text-[#aebcff]"
                  }`}
                >
                  {last ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <div className="flex flex-col gap-2 lg:gap-3.5">
                  <span className={`self-start rounded-full px-3 py-[7px] text-sm leading-[1.3] ${STATUS_CHIP[key]}`}>
                    {t(`st.${key}`)}
                  </span>
                  <span className="text-sm leading-[1.45] text-muted-foreground">{t(`stNote.${key}`)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
