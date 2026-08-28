"use client";

import { useTranslations } from "next-intl";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { NOTARY_PHONE, NOTARY_PHONE_DISPLAY, NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { SUPPORT_EMAIL } from "@/shared/utils/notaryOrderConfig";
import { trackCta } from "@/shared/utils/notaryTracking";

export default function NotaryContactSection() {
  const t = useTranslations("NotaryPage.contact");

  return (
    <section id="contact" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("subheading")}</p>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={`https://wa.me/${NOTARY_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCta("whatsapp", "footer")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-[#1ebe5d] sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" />
            {t("whatsapp")}
          </a>
          <a
            href={`tel:${NOTARY_PHONE}`}
            onClick={() => trackCta("phone", "footer")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-accent sm:w-auto"
          >
            <Phone className="h-5 w-5" />
            {NOTARY_PHONE_DISPLAY}
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            onClick={() => trackCta("email", "footer")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-accent sm:w-auto"
          >
            <Mail className="h-5 w-5" />
            {t("email")}
          </a>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{t("address")}</span>
        </div>
      </div>
    </section>
  );
}
