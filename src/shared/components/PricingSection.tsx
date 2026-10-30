"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { Button } from "@/features/ui";
import { Check, Star, Zap, Building2, Users, Sparkles, Mail, Phone, MessageCircle, X, CreditCard, Gift, Languages, FileText, LayoutTemplate, Minus, Plus } from "lucide-react";
import { PayAsYouGoModal } from "@/features/pricing/components/PayAsYouGoModal";
import { formatPriceFromString } from "@/shared/utils/domainUtils";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";
import { BOOK_DEMO_URL } from "@/shared/constants/booking";
import { PACKAGES, PAY_AS_YOU_GO_PER_PAGE, savingsGel, type PlanKey } from "@/features/pricing/packages";
import { approxPrice } from "@/shared/utils/approxPrice";

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
  /** Sent to /price as ?plan=, so the plan picked here is the one shown there. */
  planKey?: PlanKey;
  /** The price of one page, said big under the price (packages only). */
  perPage?: string;
  /** How much cheaper one page is than Pay as you go, in percent (packages only). */
  cheaperPct?: number;
  /** The lari price as a number, for the rough price in another currency. */
  priceGel?: number;
  color: "blue" | "purple" | "green" | "gold";
}

export default function PricingSection() {
  const t = useTranslations("Pricing");
  const tClosing = useTranslations("ClosingCta");
  const router = useRouter();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'translators' | 'businesses'>('translators');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPayAsYouGoModalOpen, setIsPayAsYouGoModalOpen] = useState(false);
  const [payPages, setPayPages] = useState(10);

  // Choose email based on current hostname: use info@suliko.io for suliko.io, otherwise use info@suliko.ge
  const email = typeof window !== 'undefined' && window.location.hostname.endsWith('suliko.io') ? 'info@suliko.io' : 'info@suliko.ge';

  const cheaperPct = (p: { pages: number; price: number }) =>
    Math.round((1 - p.price / p.pages / PAY_AS_YOU_GO_PER_PAGE) * 100);

  const handleButtonClick = (action: PlanAction, planKey?: PlanKey) => {
    if (action === "bookDemo") {
      window.open(BOOK_DEMO_URL, "_blank", "noopener,noreferrer");
    } else if (action === "payAsYouGo") {
      setIsPayAsYouGoModalOpen(true);
    } else {
      const pages = planKey === "payAsYouGo" ? `&pages=${payPages}` : "";
      router.push(planKey ? `/price?plan=${planKey}${pages}` : "/price");
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
        t("landing.savesVsPayAsYouGo", { amount: savingsGel(PACKAGES.starter), plan: t("payAsYouGo.title") }),
      ],
      perPage: t("landing.starterPerPage"),
      cheaperPct: cheaperPct(PACKAGES.starter),
      priceGel: PACKAGES.starter.price,
      cta: t("landing.starterCta"),
      action: "buyCredits",
      planKey: "starter",
      popular: false,
      color: "blue",
    },
    {
      name: t("professional.title"),
      price: formatPriceFromString(t("professional.price")),
      period: t("professional.period"),
      description: t("landing.professionalDescription"),
      icon: Zap,
      features: [
        t("professional.features.0"),
        t("landing.savesVsPayAsYouGo", { amount: savingsGel(PACKAGES.professional), plan: t("payAsYouGo.title") }),
        t("professional.features.3"),
        t("professional.features.4"),
      ],
      perPage: t("landing.professionalPerPage"),
      cheaperPct: cheaperPct(PACKAGES.professional),
      priceGel: PACKAGES.professional.price,
      cta: t("landing.professionalCta"),
      action: "buyCredits",
      planKey: "professional",
      popular: true,
      color: "purple",
    },
    {
      name: t("payAsYouGo.title"),
      price: formatPriceFromString(t("payAsYouGo.price")),
      period: t("landing.payAsYouGoPeriod"),
      description: t("payAsYouGo.description"),
      icon: CreditCard,
      features: [
        t("payAsYouGo.features.0"),
        t("payAsYouGo.features.1"),
      ],
      cta: t("landing.payAsYouGoCta"),
      // Matches today's live behaviour: this CTA reads "Buy Credits" and routes
      // to /price. Switch to "payAsYouGo" to open PayAsYouGoModal instead.
      action: "buyCredits",
      planKey: "payAsYouGo",
      popular: false,
      color: "green",
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
      priceGel: parseInt(t("business.price"), 10),
      cta: t("landing.businessCta"),
      action: "buyCredits",
      popular: true,
      color: "blue",
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
      priceGel: parseInt(t("enterpriseBusiness.price"), 10),
      cta: t("enterpriseBusiness.cta"),
      action: "bookDemo",
      popular: false,
      color: "gold",
    }
  ];

  const getTopBorder = (color: Plan["color"]) => {
    switch (color) {
      case "blue":
        return "border-t-4 border-t-blue-500/70";
      case "purple":
        return "border-t-4 border-t-purple-500/70";
      case "gold":
        return "border-t-4 border-t-yellow-500/70";
      case "green":
        return "border-t-4 border-t-green-500/70";
    }
  };

  const getColorClasses = (popular: boolean) => {
    const baseClasses = "relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";
    const popularClasses =
      "ring-2 ring-primary shadow-xl bg-linear-to-br from-background to-muted/20 before:absolute before:inset-0 before:rounded-lg before:bg-linear-to-r before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none";
    return `${baseClasses} ${popular ? popularClasses : ""}`;
  };

  const getIconColor = (color: Plan["color"]) => {
    switch (color) {
      case "blue":
        return "text-blue-500";
      case "purple":
        return "text-purple-500";
      case "gold":
        return "text-yellow-500";
      case "green":
        return "text-green-500";
    }
  };

  const currentPlans = activeTab === 'translators' ? translatorPlans : businessPlans;

  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-semibold text-foreground mb-6">
            {t("landing.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {t("landing.subtitle")}
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
                className={`flex-1 px-3 sm:px-6 py-3 rounded-md font-medium text-sm sm:text-base sm:whitespace-nowrap transition-all ${activeTab === 'translators'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t("landing.individuals")}
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`flex-1 px-3 sm:px-6 py-3 rounded-md font-medium text-sm sm:text-base sm:whitespace-nowrap transition-all ${activeTab === 'businesses'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t("forBusinesses")}
              </button>
            </div>
          </div>

          {/* What every package has, said once and before the buttons, where it is read */}
          {activeTab === 'translators' && (
            <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm">
              {([
                { icon: Gift, label: t("landing.free10"), accent: true },
                { icon: Languages, label: t("landing.languages"), accent: false },
                { icon: FileText, label: t("landing.formats"), accent: false },
                { icon: LayoutTemplate, label: t("landing.layout"), accent: false },
              ] as const).map(({ icon: Icon, label, accent }) => (
                <li
                  key={label}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium ${
                    accent
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-muted/40 text-foreground/80"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/*
          One reveal for the whole grid. It stays mounted when the tab changes, so
          it is revealed once. A reveal on each card left a card that appeared only
          after a tab switch (Pay as you go) stuck invisible: the reveal script
          looks for new cards on page load only.
        */}
        <div data-reveal className={`grid gap-8 max-w-7xl mx-auto ${activeTab === 'translators' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
          }`}>
          {currentPlans.map((plan, index) => (
            <Card
              key={index}
              className={`${getColorClasses(plan.popular)} ${getTopBorder(plan.color)} flex h-full flex-col ${
                plan.popular ? "order-first lg:order-none" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-red-500 px-4 py-1 text-sm font-bold whitespace-nowrap text-white shadow-lg">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {t("mostPopular")}
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`rounded-full bg-primary/10 p-3 ${getIconColor(plan.color)}`}>
                    <plan.icon className="h-8 w-8" aria-hidden />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  </div>
                  {plan.priceGel && plan.planKey !== "payAsYouGo" && approxPrice(plan.priceGel, locale) && (
                    <p className="mt-1 text-sm text-muted-foreground">{approxPrice(plan.priceGel, locale)}</p>
                  )}
                </div>
                {plan.perPage && (
                  <p className="mt-2 flex items-center justify-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400">
                    {plan.perPage}
                    {plan.cheaperPct ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-sm font-bold">
                        &minus;{plan.cheaperPct}%
                      </span>
                    ) : null}
                  </p>
                )}
                <p className="text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col grow">
                <ul className="space-y-3 mb-8 grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 shrink-0" aria-hidden />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.planKey === "payAsYouGo" && (
                  <div className="mb-6 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                    <label htmlFor="landing-payg-pages" className="block text-sm font-medium text-foreground">
                      {t("landing.payAsYouGoPagesLabel")}
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="−"
                        onClick={() => setPayPages((n) => Math.max(1, n - 1))}
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </Button>
                      <input
                        id="landing-payg-pages"
                        // Text with a numeric keypad, as in the checkout dialog: whole pages only.
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={payPages}
                        onChange={(e) =>
                          setPayPages(Math.min(5000, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))
                        }
                        className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-center text-base font-semibold text-foreground"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="+"
                        onClick={() => setPayPages((n) => Math.min(5000, n + 1))}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                    <p className="text-center text-sm font-semibold text-foreground">
                      {t("landing.payAsYouGoTotal", { amount: payPages * PAY_AS_YOU_GO_PER_PAGE })}
                    </p>
                    {payPages > PACKAGES.starter.price && (
                      <p className="text-center text-sm text-green-600 dark:text-green-400">
                        {t("landing.cheaperHint", {
                          plan: payPages <= PACKAGES.starter.pages ? t("starter.title") : t("professional.title"),
                          pages: payPages <= PACKAGES.starter.pages ? PACKAGES.starter.pages : PACKAGES.professional.pages,
                          price: payPages <= PACKAGES.starter.pages ? PACKAGES.starter.price : PACKAGES.professional.price,
                        })}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className={`w-full mt-auto ${
                    plan.popular
                      ? "bg-suliko-default-color text-white hover:bg-suliko-default-hover-color"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleButtonClick(plan.action, plan.planKey);
                  }}
                  type="button"
                >
                  {plan.planKey === "payAsYouGo" ? t("landing.payAsYouGoBuy", { count: payPages }) : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


        {/*
          One closing line, with a button. It used to be three small muted lines
          (what is included, a "not sure yet" link, a contact address) that
          nobody reached. Individuals get the free pages; businesses get the
          contact address, which is theirs alone.
        */}
        {activeTab === 'translators' ? (
          <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-6 text-center sm:flex-row sm:text-left">
            <Gift className="hidden h-8 w-8 shrink-0 text-primary sm:block" aria-hidden />
            <p className="grow text-base font-medium text-foreground">{tClosing("title")}</p>
            <Button asChild size="lg" className="shrink-0 bg-suliko-default-color text-white hover:bg-suliko-default-hover-color">
              <Link href="/document">{tClosing("cta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-muted/30 px-6 py-6 text-center">
            <p className="mb-2 text-muted-foreground">{t("needCustomSolution")}</p>
            <a href={`mailto:${email}`} className="text-lg font-semibold text-primary hover:text-primary/80">
              {email}
            </a>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-float-3 max-w-md w-full p-6 relative">
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
              <h3 className="text-2xl font-semibold text-foreground mb-2">
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
