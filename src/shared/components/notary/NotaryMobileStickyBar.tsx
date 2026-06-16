"use client";

import { useEffect, useState } from "react";
import { Upload, Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  heroRef: React.RefObject<HTMLElement | null>;
}

export default function NotaryMobileStickyBar({ heroRef }: Props) {
  const t = useTranslations("NotaryPage.hero");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when hero is no longer intersecting (scrolled past)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  const scrollToUpload = () => {
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToCalculator = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-background/95 backdrop-blur-md border-t border-border shadow-xl px-4 py-3 flex gap-3">
        <button
          type="button"
          onClick={scrollToUpload}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-lg bg-suliko-default-color py-3 text-xs font-semibold text-white shadow-sm active:opacity-90 transition-opacity"
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span className="whitespace-normal text-center leading-tight">{t("cta")}</span>
        </button>
        <button
          type="button"
          onClick={scrollToCalculator}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-xs font-semibold text-foreground active:bg-muted transition-colors"
        >
          <Calculator className="h-4 w-4 shrink-0" />
          <span className="whitespace-normal text-center leading-tight">{t("ctaSecondary")}</span>
        </button>
      </div>
      {/* Safe area padding for phones with home indicator */}
      <div className="bg-background/95 h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
