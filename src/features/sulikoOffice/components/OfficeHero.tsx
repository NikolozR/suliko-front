import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight } from "lucide-react";
import OfficeLiveDemo from "./OfficeLiveDemo";
import { CONTAINER, GHOST_BUTTON, PRIMARY_BUTTON } from "./tones";

export default function OfficeHero() {
  const t = useTranslations("SulikoOffice.hero");

  return (
    <section className={`${CONTAINER} grid items-center gap-14 pt-14 pb-20 lg:pt-[88px] lg:pb-[104px] xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] xl:gap-16`}>
      <div className="flex max-w-[640px] flex-col gap-7">
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#eef1fe] px-3 py-[7px] text-sm text-[#2a44c9] dark:bg-[#3b59f3]/20 dark:text-[#c3ceff]">
          <span aria-hidden className="h-2 w-2 rounded-full bg-suliko-default-color" />
          <span>{t("eyebrow")}</span>
        </div>
        <h1 className="text-[34px] leading-[1.08] font-bold text-foreground sm:text-5xl lg:text-[56px]">
          {t("title")}
        </h1>
        <p className="text-lg leading-[1.55] text-muted-foreground lg:text-xl">{t("sub")}</p>
        <div className="flex flex-wrap gap-3">
          <a href="#demo" className={`${PRIMARY_BUTTON} h-14 w-full px-7 text-lg sm:w-auto`}>
            {t("primary")}
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
          </a>
          <a href="#journey" className={`${GHOST_BUTTON} h-14 w-full px-6 text-lg sm:w-auto`}>
            {t("secondary")}
            <ArrowDown className="h-5 w-5 shrink-0" aria-hidden />
          </a>
        </div>
        <p className="flex flex-wrap gap-1.5 text-[15px] text-muted-foreground">
          <span>{t("already")}</span>
          <a href="https://app.suliko.ge" className="text-suliko-default-color underline-offset-2 hover:underline dark:text-[#8fa2ff]">
            {t("login")}
          </a>
        </p>
      </div>

      <div className="w-full max-w-3xl xl:max-w-none">
        <OfficeLiveDemo />
      </div>
    </section>
  );
}
