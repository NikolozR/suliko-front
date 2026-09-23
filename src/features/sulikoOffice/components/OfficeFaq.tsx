import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { CONTAINER, KICKER } from "./tones";

export const FAQ_KEYS = [1, 2, 3, 4] as const;

/** Native <details>, so the answers work and stay indexable without any JS. */
export default function OfficeFaq() {
  const t = useTranslations("SulikoOffice.faq");

  return (
    <section className={`${CONTAINER} grid items-start gap-10 py-20 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-20 lg:py-24`}>
      <div className="flex flex-col gap-3.5">
        <p className={KICKER}>{t("kicker")}</p>
        <h2 className="text-3xl leading-[1.18] font-bold text-foreground lg:text-[38px]">{t("title")}</h2>
      </div>

      <div className="flex flex-col border-t border-border">
        {FAQ_KEYS.map((n) => (
          <details key={n} open={n === 1} className="group border-b border-border">
            <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg leading-[1.4] text-foreground hover:text-suliko-default-color lg:text-xl [&::-webkit-details-marker]:hidden">
              <span>{t(`q${n}`)}</span>
              <Plus className="h-[22px] w-[22px] shrink-0 text-suliko-default-color group-open:hidden" aria-hidden />
              <Minus className="hidden h-[22px] w-[22px] shrink-0 text-suliko-default-color group-open:block" aria-hidden />
            </summary>
            <p className="pb-6 text-[17px] leading-[1.6] text-muted-foreground lg:pr-16">{t(`a${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
