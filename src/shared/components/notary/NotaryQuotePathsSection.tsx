"use client";

import { MessageCircle, Upload, Calculator, ChevronRight } from "lucide-react";
import { NOTARY_WHATSAPP } from "@/shared/constants/notary";

function scrollToTab(tab: "upload" | "calculator") {
  const section = document.getElementById("calculator");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth" });
  // After scroll animation, click the appropriate tab button
  setTimeout(() => {
    const buttons = section.querySelectorAll("button");
    // Tab order: [0] = calculator, [1] = upload (matches NotaryTabbedCalculator button order)
    const idx = tab === "calculator" ? 0 : 1;
    if (buttons[idx]) (buttons[idx] as HTMLElement).click();
  }, 600);
}

const CARDS = [
  {
    icon: MessageCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-50 dark:bg-green-950",
    title: "Send a photo on WhatsApp",
    desc: "Take a photo and send it. We reply in ~10 min.",
    badge: "EASIEST" as const,
    action: () => {
      const msg = encodeURIComponent(
        "Hello! I'd like to get a price quote for notary services."
      );
      window.open(`https://wa.me/${NOTARY_WHATSAPP}?text=${msg}`, "_blank");
    },
  },
  {
    icon: Upload,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Upload your document",
    desc: "Upload here and we'll calculate and reply by email.",
    badge: null,
    action: () => scrollToTab("upload"),
  },
  {
    icon: Calculator,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Use the price calculator",
    desc: "Get an instant estimate yourself.",
    badge: null,
    action: () => scrollToTab("calculator"),
  },
] as const;

export default function NotaryQuotePathsSection() {
  return (
    <section className="py-12 sm:py-16 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-3">
            HOW TO GET A PRICE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            3 ways to get a price.{" "}
            <span className="text-muted-foreground font-normal">
              Pick the quickest.
            </span>
          </h2>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {CARDS.map(({ icon: Icon, iconColor, iconBg, title, desc, badge, action }) => (
            <button
              key={title}
              onClick={action}
              className="group flex items-center gap-4 w-full text-left p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Icon box */}
              <div
                className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-foreground text-sm sm:text-base">
                    {title}
                  </span>
                  {badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold tracking-wide">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>

              {/* Chevron */}
              <ChevronRight className="shrink-0 h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
