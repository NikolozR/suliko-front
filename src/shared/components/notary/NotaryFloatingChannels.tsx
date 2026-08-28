"use client";

import { MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { trackCta } from "@/shared/utils/notaryTracking";

const TELEGRAM_HANDLE =
  process.env.NEXT_PUBLIC_NOTARY_TELEGRAM?.replace(/^@/, "") ?? "NotaryTranslateBot";

/**
 * Floating WhatsApp + Telegram buttons — handoff §4, §10.
 *
 * Rendered only from the notary page client, so they exist on /notary and
 * nowhere else on the site.
 *
 * Pinned below the header rather than over it: the header bar is
 * `h-14 sm:h-16 lg:h-20`, so the offsets here clear it at every breakpoint, and
 * `z-40` keeps them under both the header (`z-50`) and the mobile menu
 * (`z-[60]`) if a layout ever brings them into contact. Right-edge padding
 * matches the header's own container so they line up with the controls above.
 */
export default function NotaryFloatingChannels() {
  const t = useTranslations("NotaryPage.contact");

  return (
    <div className="fixed right-4 top-16 z-40 flex flex-row gap-2 sm:right-6 sm:top-20 lg:right-8 lg:top-24">
      <a
        href={`https://wa.me/${NOTARY_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp")}
        onClick={() => trackCta("whatsapp", "floating")}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 sm:h-12 sm:w-12"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
      <a
        href={`https://t.me/${TELEGRAM_HANDLE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("telegram")}
        onClick={() => trackCta("telegram", "floating")}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 sm:h-12 sm:w-12"
      >
        <Send className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
      </a>
    </div>
  );
}
