import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { revealDelay } from "./sections";
import { ALT_SECTION, CONTAINER, KICKER } from "./tones";

const ROWS = [1, 2, 3, 4] as const;

/** The status quo next to the product: what changes on an ordinary day. */
export default function OfficeCompare() {
  const t = useTranslations("SulikoOffice.compare");

  return (
    <section className={ALT_SECTION}>
      <div className={`${CONTAINER} flex flex-col gap-10 py-20 lg:py-24`}>
        <div data-reveal className="flex max-w-[760px] flex-col gap-3.5">
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.18] font-bold text-foreground lg:text-[38px]">{t("title")}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div data-reveal className="flex flex-col gap-1 rounded-2xl border border-border bg-[#f6f7fb] p-7 dark:bg-white/5">
            <h3 className="pb-3 text-lg text-muted-foreground">{t("now")}</h3>
            <ul className="flex flex-col divide-y divide-border">
              {ROWS.map((n) => (
                <li key={n} className="flex items-start gap-3 py-4 text-base leading-normal text-muted-foreground">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#b3261e] dark:text-red-300" aria-hidden />
                  <span>{t(`r${n}a`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-reveal
            style={revealDelay(120)}
            className="flex flex-col gap-1 rounded-2xl border border-suliko-default-color/30 bg-[#eef1fe] p-7 shadow-[0_20px_50px_-30px_rgba(17,40,156,0.35)] dark:bg-[#3b59f3]/15"
          >
            <h3 className="pb-3 text-lg font-bold text-accent-text dark:text-[#c3ceff]">{t("with")}</h3>
            <ul className="flex flex-col divide-y divide-suliko-default-color/15">
              {ROWS.map((n) => (
                <li key={n} className="flex items-start gap-3 py-4 text-base leading-normal text-foreground">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1e7440] dark:text-emerald-300" aria-hidden />
                  <span>{t(`r${n}b`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
