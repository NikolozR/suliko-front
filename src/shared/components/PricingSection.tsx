"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { Button } from "@/features/ui";
import { Check, Star, Zap, Crown } from "lucide-react";

export default function PricingSection() {
  const t = useTranslations("Pricing");

  const plans = [
    {
      name: "Starter",
      price: "57",
      period: "/month",
      description: "Perfect for individuals and small projects",
      icon: Star,
      features: [
        "75 documents per month",
        "Basic language support (50+ languages)",
        "Standard translation quality",
        "Email support",
        "Basic file formats (PDF, DOCX, TXT)",
        "5GB storage",
        "Basic API access"
      ],
      cta: "Start Free Trial",
      popular: false,
      color: "blue"
    },
    {
      name: "Professional",
      price: "173",
      period: "/month",
      description: "Ideal for growing businesses and teams",
      icon: Zap,
      features: [
        "300 documents per month",
        "Premium language support (100+ languages)",
        "Advanced translation quality with context",
        "Priority email & chat support",
        "All file formats including images",
        "50GB storage",
        "Full API access with webhooks",
        "Team collaboration tools",
        "Custom glossaries",
        "Translation memory"
      ],
      cta: "Start Free Trial",
      popular: true,
      color: "purple"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations and agencies",
      icon: Crown,
      features: [
        "Unlimited documents",
        "All languages + custom models",
        "Human-level translation quality",
        "24/7 dedicated support",
        "All file formats + custom integrations",
        "Unlimited storage",
        "Advanced API with SLA",
        "Multi-user management",
        "Custom training & fine-tuning",
        "On-premise deployment options",
        "Compliance & security certifications",
        "Dedicated account manager"
      ],
      cta: "Contact Sales",
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
                    Most Popular
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
              All plans include:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-2">
            Need a custom solution? Contact us at
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
