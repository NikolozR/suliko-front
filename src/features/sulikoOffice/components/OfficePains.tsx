import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { revealDelay } from "./sections";
import { ALT_SECTION, CONTAINER } from "./tones";

export default function OfficePains() {
  const t = useTranslations("SulikoOffice.pains");
  const pains = [1, 2, 3].map((n) => ({ q: t(`p${n}`), a: t(`a${n}`) }));

  return (
    <section className={ALT_SECTION}>
      <div className={`${CONTAINER} flex flex-col gap-6 py-14`}>
        <p data-reveal className="text-[15px] tracking-[0.3px] text-muted-foreground">
          {t("kicker")}
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {pains.map(({ q, a }, i) => (
            <div key={q} data-reveal style={revealDelay(i * 90)} className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-7">
              <p className="text-[22px] leading-[1.35] text-foreground">{q}</p>
              <p className="flex items-start gap-2.5 text-[15px] leading-normal text-[#1e7440] dark:text-emerald-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <span>{a}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
