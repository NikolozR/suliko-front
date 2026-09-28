"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { Button } from "@/features/ui";
import { Check, Star, Zap, Building2, Users, Sparkles, Clock, Mail, Phone, MessageCircle, X, CreditCard } from "lucide-react";
import { PayAsYouGoModal } from "@/features/pricing/components/PayAsYouGoModal";
import { formatPriceFromString } from "@/shared/utils/domainUtils";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { BOOK_DEMO_URL } from "@/shared/constants/booking";

/** What a plan's CTA does, independent of its translated label. */
type PlanAction = "buyCredits" | "payAsYouGo" | "bookDemo";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  cta: string;
  action: PlanAction;
  popular: boolean;
  discount?: boolean;
}

export default function PricingSection() {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'translators' | 'businesses'>('translators');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPayAsYouGoModalOpen, setIsPayAsYouGoModalOpen] = useState(false);

  // Choose email based on current hostname: use info@suliko.io for suliko.io, otherwise use info@suliko.ge
  const email = typeof window !== 'undefined' && window.location.hostname.endsWith('suliko.io') ? 'info@suliko.io' : 'info@suliko.ge';

  const handleButtonClick = (action: PlanAction) => {
    if (action === "bookDemo") {
      window.open(BOOK_DEMO_URL, "_blank", "noopener,noreferrer");
    } else if (action === "payAsYouGo") {
      setIsPayAsYouGoModalOpen(true);
    } else {
      router.push("/price");
    }
  };

  const translatorPlans: Plan[] = [
    {
      name: t("starter.title"),
      price: formatPriceFromString(t("starter.price")),
      period: t("starter.period"),
      description: t("starter.description"),
      icon: Star,
      features: [
        t("starter.features.0"),
        t("starter.features.1"),
        t("starter.features.2")
      ],
      cta: t("starter.cta"),
      action: "buyCredits",
      popular: false,
    },
    {
      name: t("professional.title"),
      price: formatPriceFromString(t("professional.price")),
      period: t("professional.period"),
      description: t("professional.description"),
      icon: Zap,
      features: [
        t("professional.features.0"),
        t("professional.features.1"),
        t("professional.features.2"),
      ],
      cta: t("professional.cta"),
      action: "buyCredits",
      popular: true,
      discount: true
    },
    {
      name: t("payAsYouGo.title"),
      price: formatPriceFromString(t("payAsYouGo.price")),
      period: t("payAsYouGo.period"),
      description: t("payAsYouGo.description"),
      icon: CreditCard,
      features: [
        t("payAsYouGo.features.0"),
        t("payAsYouGo.features.1"),
        t("payAsYouGo.features.2"),
        t("payAsYouGo.features.3")
        // t("payAsYouGo.features.4")
      ],
      cta: t("payAsYouGo.cta"),
      // Matches today's live behaviour: this CTA reads "Buy Credits" and routes
      // to /price. Switch to "payAsYouGo" to open PayAsYouGoModal instead.
      action: "buyCredits",
      popular: false,
    }
  ];

  const businessPlans: Plan[] = [
    {
      name: t("business.title"),
      price: formatPriceFromString(t("business.price")),
      period: t("business.period"),
      description: t("business.description"),
      icon: Building2,
      features: [
        t("business.features.0"),
        t("business.features.1"),
        t("business.features.2"),
        t("business.features.3")
      ],
      cta: t("business.cta"),
      action: "buyCredits",
      popular: true,
      discount: true
    },
    {
      name: t("enterpriseBusiness.title"),
      price: formatPriceFromString(t("enterpriseBusiness.price")),
      period: t("enterpriseBusiness.period"),
      description: t("enterpriseBusiness.description"),
      icon: Users,
      features: [
        t("enterpriseBusiness.features.0"),
        t("enterpriseBusiness.features.1"),
        t("enterpriseBusiness.features.2"),
        t("enterpriseBusiness.features.3"),
        t("enterpriseBusiness.features.4"),
        t("enterpriseBusiness.features.5"),
        t("enterpriseBusiness.features.6"),
        t("enterpriseBusiness.features.7")
      ],
      cta: t("enterpriseBusiness.cta"),
      action: "bookDemo",
      popular: false,
    }
  ];

  const currentPlans = activeTab === 'translators' ? translatorPlans : businessPlans;

  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {t("description")}
          </p>

          {/* Tabs */}
          {/*
            The pill is capped at the container width and its buttons share the
            space, rather than sizing to their labels. Georgian runs long enough
            ("თარჯიმნებისთვის" / "ბიზნესისთვის") that the intrinsic width was
            407px against a 390px viewport, which was the one thing making the
            landing page scroll sideways on a phone.
          */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg inline-flex max-w-full">
              <button
                onClick={() => setActiveTab('translators')}
                className={`flex-1 px-3 sm:px-6 py-3 rounded-md font-medium text-sm sm:text-base transition-all ${activeTab === 'translators'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t("forTranslators")}
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`flex-1 px-3 sm:px-6 py-3 rounded-md font-medium text-sm sm:text-base transition-all ${activeTab === 'businesses'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t("forBusinesses")}
              </button>
            </div>
          </div>
        </div>

        <div className={`grid gap-8 max-w-7xl mx-auto ${activeTab === 'translators' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
          }`}>
          {currentPlans.map((plan, index) => (
            <Card
              key={index}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 90}ms` }}
              className={`relative flex h-full flex-col transition-shadow duration-300 hover:shadow-lg ${
                plan.popular ? "ring-2 ring-suliko-default-color shadow-xl" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-suliko-default-color px-3.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-md">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {t("mostPopular")}
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="rounded-2xl bg-suliko-default-color/10 p-3 text-suliko-default-color dark:text-blue-300">
                    <plan.icon className="h-7 w-7" aria-hidden />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  {plan.discount ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-muted-foreground line-through">
                          {(() => {
                            const numericPrice = plan.price.replace(/[₾€$€\s]/g, '').trim();
                            if (numericPrice === "50") return formatPriceFromString("62");
                            if (numericPrice === "500") return formatPriceFromString("625");
                            return plan.price;
                          })()}
                        </span>
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                        <Clock className="h-3 w-3" aria-hidden />
                        {t("discount")} · {t("limitedTime")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col grow">
                <ul className="space-y-3 mb-8 grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-suliko-default-color dark:text-blue-300 mr-3 mt-0.5 shrink-0" aria-hidden />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full mt-auto ${
                    plan.popular
                      ? "bg-suliko-default-color text-white hover:bg-suliko-default-hover-color"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleButtonClick(plan.action);
                  }}
                  type="button"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-2">
            {t("needCustomSolution")}
          </p>
          <a
            href={`mailto:${email}`}
            className="text-primary hover:text-primary/80 font-medium"
          >
            {email}
          </a>
        </div>
      </div>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsContactModalOpen(false);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t("contactModal.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("contactModal.subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={`mailto:${email}`}
                className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 bg-primary/10 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("contactModal.email")}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </a>

              <a
                href={`tel:${NOTARY_PHONE}`}
                className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 bg-primary/10 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("contactModal.phone")}</p>
                  <p className="text-sm text-muted-foreground">{NOTARY_PHONE}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${NOTARY_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 bg-green-500/10 rounded-full mr-4 group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("contactModal.whatsapp")}</p>
                  <p className="text-sm text-muted-foreground">{NOTARY_PHONE}</p>
                </div>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsContactModalOpen(false);
                }}
                className="w-full"
                variant="outline"
                type="button"
              >
                {t("contactModal.close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pay As You Go Modal */}
      <PayAsYouGoModal
        isOpen={isPayAsYouGoModalOpen}
        onClose={() => setIsPayAsYouGoModalOpen(false)}
      />
    </section>
  );
}
