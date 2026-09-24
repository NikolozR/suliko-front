import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { SECTION_ANCHOR, revealDelay, type NavSection } from "./sections";
import { ALT_SECTION, CONTAINER, KICKER } from "./tones";

const ANCHOR: Record<"pricing" | "payouts" | "reports", NavSection> = { pricing: "pricing", payouts: "finance", reports: "reports" };

/**
 * A text column beside one of the product demos. `reverse` puts the demo on the
 * left; `band` sets the section on a white band instead of the page's soft blue.
 */
export default function OfficeSpotlight({
  id,
  demo,
  reverse = false,
  band = false,
}: {
  id: "pricing" | "payouts" | "reports";
  demo: ReactNode;
  reverse?: boolean;
  band?: boolean;
}) {
  const t = useTranslations(`SulikoOffice.spot.${id}`);

  return (
    <section id={ANCHOR[id]} className={`${SECTION_ANCHOR} ${band ? ALT_SECTION : ""}`}>
      <div className={`${CONTAINER} grid items-center gap-14 py-20 lg:grid-cols-2 lg:gap-20 lg:py-24`}>
        <div data-reveal className={`flex max-w-[560px] flex-col gap-5 ${reverse ? "lg:order-2" : ""}`}>
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("title")}</h2>
          <p className="text-lg leading-[1.55] text-muted-foreground">{t("body")}</p>
          <ul className="mt-2 flex flex-col gap-3.5">
            {(["p1", "p2", "p3"] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-base leading-normal text-[#3a4466] dark:text-slate-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-suliko-default-color dark:text-[#8fa2ff]" aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal style={revealDelay(150)} className={`w-full max-w-xl justify-self-center ${reverse ? "lg:order-1" : ""}`}>
          {demo}
        </div>
      </div>
    </section>
  );
}
