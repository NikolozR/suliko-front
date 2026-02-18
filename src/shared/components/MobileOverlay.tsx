"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing"; 
import { useTranslations } from "next-intl";

// we persist dismissals across sessions so the overlay is only shown once per user
const STORAGE_KEY = "dismissMobileOverlay";

export default function MobileOverlay() {
  const [show, setShow] = useState(false);
  const t = useTranslations("mobileOverlay");

  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      // use localStorage instead of sessionStorage so the flag survives reloads
      const dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
      const path = pathname || "/";
      const segments = path.split("/").filter(Boolean);
      // Landing page is either root `/` (no segments) or just `/locale` (one segment equal to a known locale)
      const isLanding =
        segments.length === 0 || (segments.length === 1 && ((routing.locales as unknown as string[]).includes(segments[0])));

      setShow(window.innerWidth < 1024 && !dismissed && !isLanding);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [pathname]);

  if (!show) return null;

  const dismiss = (remember = true) => {
    if (remember) sessionStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 lg:hidden"
    >
      <div className="mx-4 p-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold text-suliko-default-color mb-4">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t("mobileOverlayText")}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => dismiss(true)}
            className="px-4 py-2 rounded-md border border-transparent bg-transparent text-muted-foreground hover:underline"
          >
            {t("continueAnyway")}
          </button>
        </div>
      </div>
    </div>
  );
}
