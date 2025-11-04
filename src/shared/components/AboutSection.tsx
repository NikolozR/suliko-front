"use client";

import { Card, CardContent } from "@/features/ui";
import { Brain, Shield, Zap, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AboutSection() {
  const t = useTranslations("AboutSection");
  
  const features = [
    {
      icon: Brain,
      title: t("features.aiPowered.title"),
      description: t("features.aiPowered.description")
    },
    {
      icon: Shield,
      title: t("features.security.title"),
      description: t("features.security.description")
    },
    {
      icon: Zap,
      title: t("features.speed.title"),
      description: t("features.speed.description")
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          {t("subtitle") && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("subtitle")}
            </p>
          )}
        </div>

        {/* Mission Statement */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">{t("mission")}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("missionText")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Video Section removed as requested */}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Experience Disclaimer */}
        <div className="max-w-3xl mx-auto mt-16">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    <Monitor className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground leading-relaxed">
                    {t("desktopDisclaimer")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
}
