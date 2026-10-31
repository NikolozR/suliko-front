"use client";

import { useTranslations } from "next-intl";

// First focusable element on every page: lets keyboard and screen reader users
// jump past the sidebar or header. Targets `id="main-content"` on each <main>.
export default function SkipLink() {
  const t = useTranslations("A11y");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {t("skipToContent")}
    </a>
  );
}
