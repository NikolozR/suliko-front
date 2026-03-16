"use client";

import { Brain, Shield, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AboutSection() {
  const t = useTranslations("AboutSection");

  const features = [
    {
      number: "01",
      icon: Brain,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: t("features.aiPowered.title"),
      description: t("features.aiPowered.description"),
    },
    {
      number: "02",
      icon: Shield,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      title: t("features.security.title"),
      description: t("features.security.description"),
    },
    {
      number: "03",
      icon: Zap,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      title: t("features.speed.title"),
      description: t("features.speed.description"),
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Unified Feature Panel */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start gap-5 px-7 py-6 hover:bg-primary/5 transition-colors duration-200 ${
                  index < features.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                {/* Number */}
                <span className="text-xs font-mono text-muted-foreground/50 mt-1 w-6 shrink-0 select-none">
                  {feature.number}
                </span>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${feature.iconBg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
