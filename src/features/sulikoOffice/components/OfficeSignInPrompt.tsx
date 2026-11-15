import type { CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { officeSignInUrl } from "../lib/officeLinks";

/**
 * The way in for people who already use Suliko Office, now that the page's main
 * button books a demo: a line of small print, not a button.
 */
export default function OfficeSignInPrompt({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const t = useTranslations("SulikoOffice.signInPrompt");
  const locale = useLocale();

  return (
    <p className={`flex flex-wrap gap-1.5 text-[15px] text-muted-foreground ${className}`} style={style}>
      <span>{t("text")}</span>
      <a href={officeSignInUrl(locale)} className="text-accent-text underline-offset-2 hover:underline dark:text-[#8fa2ff]">
        {t("link")}
      </a>
    </p>
  );
}
