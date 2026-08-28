"use client";

import { useTranslations } from "next-intl";
import { Calculator, ChevronRight, ClipboardList, MessageCircle } from "lucide-react";
import { NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { scrollToPanelTab } from "@/shared/utils/notaryScroll";
import { trackCta } from "@/shared/utils/notaryTracking";

/**
 * The three conversion paths, ranked by how little the visitor has to do —
 * handoff §4. Each one lands somewhere that can actually produce a price.
 */
export default function NotaryQuotePathsSection() {
  const t = useTranslations("NotaryPage.quotePaths");

  const openWhatsApp = () => {
    trackCta("whatsapp", "hero");
    const message = encodeURIComponent(t("whatsappMessage"));
    window.open(`https://wa.me/${NOTARY_WHATSAPP}?text=${message}`, "_blank", "noopener");
  };

  const cards = [
    {
      key: "whatsapp",
      icon: MessageCircle,
      iconColor: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/10",
      title: t("whatsappTitle"),
      desc: t("whatsappDesc"),
      badge: t("easiest"),
      action: openWhatsApp,
    },
    {
      key: "order",
      icon: ClipboardList,
      iconColor: "text-suliko-default-color",
      iconBg: "bg-suliko-default-color/10",
      title: t("orderTitle"),
      desc: t("orderDesc"),
      badge: null,
      action: () => scrollToPanelTab("order"),
    },
    {
      key: "calculator",
      icon: Calculator,
      iconColor: "text-suliko-default-color",
      iconBg: "bg-suliko-default-color/10",
      title: t("calculatorTitle"),
      desc: t("calculatorDesc"),
      badge: null,
      action: () => scrollToPanelTab("calculator"),
    },
  ];

  return (
    <section className="bg-muted/50 py-12 sm:py-16">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {t("sectionBadge")}
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("heading")}{" "}
            <span className="font-normal text-muted-foreground">{t("headingSub")}</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {cards.map(({ key, icon: Icon, iconColor, iconBg, title, desc, badge, action }) => (
            <button
              key={key}
              type="button"
              onClick={action}
              className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:p-5"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground sm:text-base">
                    {title}
                  </span>
                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold tracking-wide text-green-700 dark:text-green-300">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
