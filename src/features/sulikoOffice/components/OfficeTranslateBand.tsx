import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CONTAINER, GHOST_BUTTON, KICKER } from "./tones";

/**
 * For the visitor who is not a bureau at all and only needs a document
 * translated: the way across to Suliko Translate.
 */
export default function OfficeTranslateBand() {
  const t = useTranslations("SulikoOffice.translateBand");

  return (
    <section className={`${CONTAINER} py-8 lg:py-10`}>
      <div
        data-reveal
        className="flex flex-col items-start justify-between gap-6 rounded-[20px] bg-[#eef1fe] px-6 py-9 sm:px-10 lg:flex-row lg:items-center dark:bg-[#3b59f3]/15"
      >
        <div className="flex max-w-2xl flex-col gap-2.5">
          <p className={KICKER}>{t("kicker")}</p>
          <h2 className="text-2xl leading-[1.2] font-bold text-foreground lg:text-[28px]">{t("title")}</h2>
          <p className="text-base leading-[1.55] text-muted-foreground">{t("body")}</p>
        </div>
        <Link href="/translate" className={`${GHOST_BUTTON} group h-12 shrink-0 px-6 text-base`}>
          {t("cta")}
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
