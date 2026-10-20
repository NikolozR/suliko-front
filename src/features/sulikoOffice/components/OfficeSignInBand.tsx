import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { officeSignInUrl } from "../lib/officeLinks";
import { CONTAINER, GHOST_BUTTON } from "./tones";

/**
 * The page ends on the demo form; this slim band below it is for the people who
 * are already customers and only came to sign in.
 */
export default function OfficeSignInBand() {
  const t = useTranslations("SulikoOffice.signIn");
  const locale = useLocale();

  return (
    <section className={`${CONTAINER} py-12 lg:py-16`}>
      <div
        data-reveal
        className="flex flex-col items-start justify-between gap-5 rounded-[20px] border border-border bg-background px-6 py-7 sm:flex-row sm:items-center sm:px-10"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl leading-[1.2] font-bold text-foreground">{t("title")}</h2>
          <p className="text-base leading-[1.55] text-muted-foreground">{t("sub")}</p>
        </div>
        <a href={officeSignInUrl(locale)} className={`${GHOST_BUTTON} group h-12 shrink-0 px-6 text-base`}>
          {t("button")}
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
      </div>
    </section>
  );
}
