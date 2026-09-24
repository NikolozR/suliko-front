import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, ClipboardCheck, UserPlus, Users } from "lucide-react";
import CountUp from "./CountUp";
import { ALT_SECTION, CONTAINER, KICKER, TONES, type Tone } from "./tones";

/**
 * Operational figures from our own bureau's Suliko Office dashboard, September
 * 2026, rounded down so they stay true as the bureau grows. Revenue, profit
 * and receivables stay off this page on purpose.
 *
 * Source: 1,030 orders to date; 715 clients (571 individuals, 144 companies);
 * 127 orders in August and 117 by 23 September; 99 new clients in August and
 * 82 by 23 September. Update the numbers and the caption together.
 */
const STATS: { value: number; key: "s1" | "s2" | "s3" | "s4"; icon: LucideIcon; tone: Tone }[] = [
  { value: 1030, key: "s1", icon: ClipboardCheck, tone: "blue" },
  { value: 715, key: "s2", icon: Users, tone: "amber" },
  { value: 120, key: "s3", icon: CalendarDays, tone: "green" },
  { value: 80, key: "s4", icon: UserPlus, tone: "blue" },
];

export default function OfficeProof() {
  const t = useTranslations("SulikoOffice.proof");
  const locale = useLocale();

  return (
    <section className={ALT_SECTION}>
      <div className={`${CONTAINER} grid items-center gap-12 py-20 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-16 lg:py-24`}>
        <div className="flex flex-col gap-3.5">
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.18] font-bold text-foreground lg:text-[38px]">{t("title")}</h2>
          <p className="text-[17px] leading-[1.55] text-muted-foreground">{t("sub")}</p>
        </div>

        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {STATS.map(({ value, key, icon: Icon, tone }) => {
              const c = TONES[tone];
              return (
                <div key={key} className={`flex flex-col gap-3 rounded-2xl p-4 sm:gap-4 sm:p-7 ${c.card}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white sm:h-11 sm:w-11 dark:bg-white/10">
                    <Icon className={`h-5 w-5 sm:h-[22px] sm:w-[22px] ${c.icon}`} aria-hidden />
                  </span>
                  <div className="flex flex-col-reverse gap-2">
                    <dt className="flex flex-col gap-1">
                      <span className="text-sm text-foreground sm:text-base">{t(`${key}l`)}</span>
                      <span className={`text-xs leading-snug sm:text-sm ${c.body}`}>{t(`${key}s`)}</span>
                    </dt>
                    <dd className="text-[34px] leading-none text-suliko-default-color sm:text-[52px] dark:text-[#8fa2ff]">
                      <CountUp value={value} suffix="+" locale={locale} />
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
          <p className="text-sm text-muted-foreground">{t("caption")}</p>
        </div>
      </div>
    </section>
  );
}
