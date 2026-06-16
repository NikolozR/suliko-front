"use client";

import { useTranslations } from "next-intl";
import { Award, Zap, Stamp } from "lucide-react";

const FEATURES = [
  { icon: Award,  titleKey: "f1title" as const, descKey: "f1desc" as const },
  { icon: Zap,    titleKey: "f2title" as const, descKey: "f2desc" as const },
  { icon: Stamp,  titleKey: "f3title" as const, descKey: "f3desc" as const },
];



export default function NotaryAboutSection() {
  const t = useTranslations("NotaryPage.about");

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
            {t("sectionBadge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        {/* Feature cards — stacked on mobile, 3-col grid on lg+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="flex items-start gap-4 px-5 py-5 bg-card border border-border/50 rounded-2xl hover:bg-primary/5 transition-colors duration-200"
            >
              <div className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--suliko-default-color)]/10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--suliko-default-color)]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { value: "10+", label: t("stat1Label") },
            { value: "5k+", label: t("stat2Label") },
            { value: "20+", label: t("stat3Label") },
          ].map(({ value, label }) => (
            <div key={value} className="text-center py-4 px-2 rounded-xl border border-border bg-card">
              <p className="text-2xl font-extrabold text-[var(--suliko-default-color)]">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
