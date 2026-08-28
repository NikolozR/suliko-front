"use client";

import { useEffect, useState } from "react";
import { ClipboardList, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { scrollToPanelTab } from "@/shared/utils/notaryScroll";
import { trackCta } from "@/shared/utils/notaryTracking";

interface Props {
  heroRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mobile sticky CTA bar — handoff §4, §10.
 *
 * Appears once the hero scrolls out of view, so the two never compete. Carries
 * the order path plus the two channels that convert fastest on a phone.
 */
export default function NotaryMobileStickyBar({ heroRef }: Props) {
  const t = useTranslations("NotaryPage.hero");
  const tc = useTranslations("NotaryPage.contact");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.05 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex gap-2 border-t border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => scrollToPanelTab("order")}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-suliko-default-color py-3 text-xs font-semibold text-white shadow-sm transition-opacity active:opacity-90"
        >
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span className="whitespace-normal text-center leading-tight">{t("cta")}</span>
        </button>

        <a
          href={`https://wa.me/${NOTARY_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tc("whatsapp")}
          onClick={() => trackCta("whatsapp", "sticky_bar")}
          className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white transition-opacity active:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
        </a>

        <a
          href={`tel:${NOTARY_PHONE}`}
          aria-label={tc("call")}
          onClick={() => trackCta("phone", "sticky_bar")}
          className="flex w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors active:bg-muted"
        >
          <Phone className="h-5 w-5" />
        </a>
      </div>
      {/* Safe-area padding for phones with a home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
    </div>
  );
}
