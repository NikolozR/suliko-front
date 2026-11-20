"use client";

import { useLocale } from "next-intl";
import { Bilingual, inOrder } from "../utils/paymentResultText";

interface BilingualTextProps {
  text: Bilingual;
  /** Applied to both lines. */
  className?: string;
  /** Added to the second line, so the two read as one message rather than two. */
  secondClassName?: string;
}

/** One message in Georgian and English, the site's own language first. */
export function BilingualText({ text, className = "", secondClassName = "opacity-80" }: BilingualTextProps) {
  const locale = useLocale();
  const [first, second] = inOrder(text, locale);
  const [firstLang, secondLang] = locale === "ka" ? ["ka", "en"] : ["en", "ka"];

  return (
    <>
      <span lang={firstLang} className={`block ${className}`}>
        {first}
      </span>
      <span lang={secondLang} className={`block mt-1 ${className} ${secondClassName}`}>
        {second}
      </span>
    </>
  );
}
