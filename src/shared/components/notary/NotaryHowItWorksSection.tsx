"use client";

import { useTranslations } from "next-intl";
import { Upload, FileCheck, CheckCircle } from "lucide-react";

const STEPS = [
  { icon: Upload,      titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { icon: FileCheck,   titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { icon: CheckCircle, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
];

export default function NotaryHowItWorksSection() {
  const t = useTranslations("NotaryPage.services");

  return (
    <section id="services" className="py-20 bg-background">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {STEPS.map(({ icon: Icon, titleKey, descKey }, index) => (
            <div key={titleKey} className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-200">
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--suliko-default-color)] text-white text-sm font-bold flex items-center justify-center shadow-md">
                {index + 1}
              </div>

              <div className="mb-5 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
