import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import OfficeDemoForm from "./OfficeDemoForm";
import { revealDelay } from "./sections";
import { ALT_SECTION, CONTAINER, KICKER } from "./tones";

export default function OfficeDemoSection() {
  const t = useTranslations("SulikoOffice.form");

  return (
    <section id="demo" className={`${ALT_SECTION} scroll-mt-20 border-b-0`}>
      <div className={`${CONTAINER} grid items-start gap-12 py-20 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-[72px] lg:py-24`}>
        <div data-reveal className="flex flex-col gap-5">
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("title")}</h2>
          <p className="text-lg leading-[1.55] text-muted-foreground">{t("sub")}</p>
          <div className="mt-3 flex flex-col gap-3.5">
            <p className="text-[15px] text-foreground">{t("onCall")}</p>
            {(["e1", "e2", "e3"] as const).map((key) => (
              <p key={key} className="flex items-start gap-3 text-base leading-normal text-[#3a4466] dark:text-slate-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-suliko-default-color dark:text-[#8fa2ff]" aria-hidden />
                <span>{t(key)}</span>
              </p>
            ))}
          </div>
        </div>

        <div data-reveal style={revealDelay(150)} className="relative rounded-[20px] border border-border bg-background p-6 shadow-[0_20px_50px_-30px_rgba(17,40,156,0.25)] sm:p-10">
          <OfficeDemoForm />
        </div>
      </div>
    </section>
  );
}
