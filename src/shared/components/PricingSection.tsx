"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { Button } from "@/features/ui";
import { Check, Star, Zap, Crown } from "lucide-react";

export default function PricingSection() {
  const t = useTranslations("Pricing");

  const plans = [
    {
      name: t("starter.title"),
      price: t("starter.price"),
      period: t("starter.period"),
      description: t("starter.description"),
      icon: Star,
      features: [
        t("starter.features.0"),
        t("starter.features.1"),
        t("starter.features.2"),
        t("starter.features.3"),
        t("starter.features.4"),
        t("starter.features.5"),
        t("starter.features.6")
      ],
      cta: t("starter.cta"),
      popular: false,
      color: "blue"
    },
    {
      name: t("professional.title"),
      price: t("professional.price"),
      period: t("professional.period"),
      description: t("professional.description"),
      icon: Zap,
      features: [
        t("professional.features.0"),
        t("professional.features.1"),
        t("professional.features.2"),
        t("professional.features.3"),
        t("professional.features.4"),
        t("professional.features.5"),
        t("professional.features.6"),
        t("professional.features.7"),
        t("professional.features.8"),
        t("professional.features.9")
      ],
      cta: t("professional.cta"),
      popular: true,
      color: "purple"
    },
    {
      name: t("enterprise.title"),
      price: t("enterprise.price"),
      period: t("enterprise.period"),
      description: t("enterprise.description"),
      icon: Crown,
      features: [
        t("enterprise.features.0"),
        t("enterprise.features.1"),
        t("enterprise.features.2"),
        t("enterprise.features.3"),
        t("enterprise.features.4"),
        t("enterprise.features.5"),
        t("enterprise.features.6"),
        t("enterprise.features.7"),
        t("enterprise.features.8"),
        t("enterprise.features.9"),
        t("enterprise.features.10"),
        t("enterprise.features.11")
      ],
      cta: t("enterprise.cta"),
      popular: false,
      color: "gold"
    }
  ];

  const getColorClasses = (color: string, popular: boolean) => {
    const baseClasses = "relative";
    const popularClasses = "ring-2 ring-primary shadow-xl scale-105";
    
    switch (color) {
      case "blue":
        return `${baseClasses} ${popular ? popularClasses : ""}`;
      case "purple":
        return `${baseClasses} ${popular ? popularClasses : ""}`;
      case "gold":
        return `${baseClasses} ${popular ? popularClasses : ""}`;
      default:
        return baseClasses;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-500";
      case "purple":
        return "text-purple-500";
      case "gold":
        return "text-yellow-500";
      default:
        return "text-primary";
    }
  };

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={getColorClasses(plan.color, plan.popular)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    {t("professional.popular")}
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full bg-primary/10 ${getIconColor(plan.color)}`}>
                    <plan.icon className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-secondary hover:bg-secondary/90"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t("allPlansInclude")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>{t("freeTrial")}</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>{t("noSetupFees")}</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>{t("cancelAnytime")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-2">
            {t("needCustomSolution")}
          </p>
          <a
            href={`mailto:${t("email")}`}
            className="text-primary hover:text-primary/80 font-medium"
          >
            {t("email")}
          </a>
        </div>
      </div>
    </section>
  );
}
