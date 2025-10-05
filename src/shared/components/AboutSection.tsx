"use client";

import { Card, CardContent } from "@/features/ui";
import { Brain, Shield, Zap, Target } from "lucide-react";
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

        {/* Video Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">{t("video.title")}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("video.description")}
            </p>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/HcP7GnI04Aw"
              title={t("video.title")}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

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

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10M+</div>
            <div className="text-sm text-muted-foreground">{t("stats.documentsTranslated")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">150+</div>
            <div className="text-sm text-muted-foreground">{t("stats.languagesSupported")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">{t("stats.happyCustomers")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">{t("stats.uptimeGuarantee")}</div>
          </div>
        </div>

      </div>
    </section>
  );
}
