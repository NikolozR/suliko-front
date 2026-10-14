import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { officeSignInUrl } from "../lib/officeLinks";
import OfficeDemoPrompt from "./OfficeDemoPrompt";
import { CONTAINER, PRIMARY_BUTTON } from "./tones";

/**
 * Closes the page on the way in: Sign in, with the demo form just below for
 * anyone who is new.
 */
export default function OfficeSignInBand() {
  const t = useTranslations("SulikoOffice.signIn");
  const locale = useLocale();

  return (
    <section className={`${CONTAINER} py-16 lg:py-20`}>
      <div
        data-reveal
        className="flex flex-col items-center gap-5 rounded-[20px] border border-border bg-background px-6 py-12 text-center shadow-[0_20px_50px_-30px_rgba(17,40,156,0.25)] sm:px-10 lg:py-16"
      >
        <h2 className="text-3xl leading-[1.15] font-bold text-foreground lg:text-[42px]">{t("title")}</h2>
        <p className="max-w-xl text-lg leading-[1.55] text-muted-foreground">{t("sub")}</p>
        <a href={officeSignInUrl(locale)} className={`${PRIMARY_BUTTON} group mt-2 h-14 px-8 text-lg`}>
          {t("button")}
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
        <OfficeDemoPrompt className="justify-center" />
      </div>
    </section>
  );
}
