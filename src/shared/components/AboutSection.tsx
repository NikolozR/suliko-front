"use client";

import { Card, CardContent } from "@/features/ui";
import { Brain, Shield, Zap } from "lucide-react";
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group border border-border/60 rounded-2xl hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
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

      </div>
    </section>
  );
}
