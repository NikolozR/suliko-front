import { useTranslations } from "next-intl";
import { ArrowRight, BadgeCheck, Gauge, Rocket, Tags } from "lucide-react";
import { SECTION_ANCHOR, revealDelay } from "./sections";
import { CONTAINER, KICKER, PRIMARY_BUTTON } from "./tones";

const ITEMS = [
  { key: "o1", icon: Rocket },
  { key: "o2", icon: Tags },
  { key: "o3", icon: Gauge },
  { key: "o4", icon: BadgeCheck },
] as const;

/**
 * The proposal: what a bureau gets, laid out the way a written offer would, and
 * one button that leads to the demo form where the offer is asked for.
 */
export default function OfficeOffer() {
  const t = useTranslations("SulikoOffice.offer");

  return (
    <section id="offer" className={`${CONTAINER} ${SECTION_ANCHOR} flex flex-col gap-11 py-20 lg:py-24`}>
      <div data-reveal className="flex max-w-[760px] flex-col gap-3.5">
        <p className={KICKER}>{t("kicker")}</p>
        <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("title")}</h2>
        <p className="text-lg leading-[1.55] text-muted-foreground">{t("sub")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }, i) => (
          <div
            key={key}
            data-reveal
            style={revealDelay(i * 90)}
            className="flex flex-col gap-3.5 rounded-2xl border border-border bg-background p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1fe] text-accent-text dark:bg-[#3b59f3]/20 dark:text-[#aebcff]">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-xl leading-[1.3] text-foreground">{t(`${key}t`)}</h3>
            <p className="text-base leading-[1.55] text-muted-foreground">{t(`${key}d`)}</p>
          </div>
        ))}
      </div>

      <div data-reveal className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <a href="#demo" className={`${PRIMARY_BUTTON} group h-14 px-7 text-lg`}>
          {t("cta")}
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
        <p className="max-w-xl text-base leading-normal text-muted-foreground">{t("note")}</p>
      </div>
    </section>
  );
}
