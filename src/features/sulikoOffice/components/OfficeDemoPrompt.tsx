import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

/**
 * The way to the demo form, now that Sign in is the page's main button: a line
 * of small print, not a button.
 */
export default function OfficeDemoPrompt({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const t = useTranslations("SulikoOffice.demoPrompt");

  return (
    <p className={`flex flex-wrap gap-1.5 text-[15px] text-muted-foreground ${className}`} style={style}>
      <span>{t("text")}</span>
      <a href="#demo" className="text-suliko-default-color underline-offset-2 hover:underline dark:text-[#8fa2ff]">
        {t("link")}
      </a>
    </p>
  );
}
