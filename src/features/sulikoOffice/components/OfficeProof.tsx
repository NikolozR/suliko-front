import { useTranslations } from "next-intl";
import { ALT_SECTION, CONTAINER, KICKER } from "./tones";

/**
 * Operational figures from our own bureau's dashboard (September 2026), rounded
 * down. Revenue, profit and receivables stay off this page on purpose.
 */
const STATS = [
  { value: "1,000+", label: "s1l" },
  { value: "700+", label: "s2l" },
  { value: "140+", label: "s3l" },
  { value: "~120", label: "s4l" },
] as const;

export default function OfficeProof() {
  const t = useTranslations("SulikoOffice.proof");

  return (
    <section className={ALT_SECTION}>
      <div className={`${CONTAINER} grid items-start gap-12 py-20 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-20 lg:py-24`}>
        <div className="flex flex-col gap-3.5">
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.18] font-bold text-foreground lg:text-[38px]">{t("title")}</h2>
          <p className="text-[17px] leading-[1.55] text-muted-foreground">{t("sub")}</p>
        </div>

        <dl className="grid grid-cols-2">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse gap-2 pt-7 ${i < 2 ? "border-t-2 border-foreground pb-8" : "border-t border-border pb-2"} ${
                i % 2 === 0 ? "pr-4 sm:pr-7" : "pl-4 sm:pl-7"
              }`}
            >
              <dt className="text-[17px] text-[#3a4466] dark:text-slate-300">{t(s.label)}</dt>
              <dd className="text-[44px] leading-none text-suliko-default-color sm:text-[64px] dark:text-[#8fa2ff]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
