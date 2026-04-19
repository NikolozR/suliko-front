"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, Mail, MapPin } from "lucide-react";

export default function NotaryContactSection() {
  const t = useTranslations("NotaryPage.contact");

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("subheading")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <a
            href="https://wa.me/995591729911"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-[#1ebe5d] transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5" />
            {t("whatsapp")}
          </a>
          <a
            href="mailto:info@th.com.ge"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors duration-200"
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
