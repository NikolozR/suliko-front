"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { Button } from "@/features/ui";
import { Check, Star, Zap, Crown, Building2, Users, Sparkles, Clock, Mail, Phone, MessageCircle, X } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  cta: string;
  popular: boolean;
  color: string;
  discount?: boolean;
}

export default function PricingSection() {
  const t = useTranslations("Pricing");
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'translators' | 'businesses'>('translators');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleButtonClick = (ctaText: string) => {
    if (ctaText === "Contact Sales" || ctaText === "დაგვიკავშირდით" || ctaText === "Skontaktuj się ze sprzedażą") {
      setIsContactModalOpen(true);
    } else {
      // Redirect to document translation page
      router.push(`/${locale}/document`);
    }
  };

  const translatorPlans: Plan[] = [
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
      color: "purple",
      discount: true
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

  const businessPlans: Plan[] = [
    {
      name: t("business.title"),
      price: t("business.price"),
      period: t("business.period"),
      description: t("business.description"),
      icon: Building2,
      features: [
        t("business.features.0"),
        t("business.features.1"),
        t("business.features.2"),
        t("business.features.3"),
        t("business.features.4"),
        t("business.features.5"),
        t("business.features.6")
      ],
      cta: t("business.cta"),
      popular: true,
      color: "blue",
      discount: true
    },
    {
      name: t("enterpriseBusiness.title"),
      price: t("enterpriseBusiness.price"),
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
        t("enterpriseBusiness.features.7"),
        t("enterpriseBusiness.features.8"),
        t("enterpriseBusiness.features.9"),
        t("enterpriseBusiness.features.10"),
        t("enterpriseBusiness.features.11")
      ],
      cta: t("enterpriseBusiness.cta"),
      popular: false,
      color: "gold"
    }
  ];

  const currentPlans = activeTab === 'translators' ? translatorPlans : businessPlans;

  const getColorClasses = (color: string, popular: boolean) => {
    const baseClasses = "relative transition-all duration-300 hover:shadow-lg";
    const popularClasses = "ring-2 ring-primary shadow-xl scale-105 bg-gradient-to-br from-background to-muted/20 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none";
    
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
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {t("description")}
          </p>
          
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg inline-flex">
              <button
                onClick={() => setActiveTab('translators')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'translators'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t("forTranslators")}
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'businesses'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t("forBusinesses")}
              </button>
            </div>
          </div>
        </div>

        <div className={`grid gap-8 max-w-7xl mx-auto ${
          activeTab === 'translators' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {currentPlans.map((plan, index) => (
             <Card
               key={index}
               className={`${getColorClasses(plan.color, plan.popular)} flex flex-col h-full`}
             >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t("mostPopular")}
                  </div>
                </div>
              )}
              
              {plan.discount && (
                <div className="absolute -top-2 -right-2 z-20 animate-pulse">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12 flex items-center gap-1 border-2 border-white">
                    <Clock className="h-2 w-2" />
                    {t("discount")}
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
                  {plan.discount ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-2">
                         <span className="text-2xl text-muted-foreground line-through">
                           {plan.price === "173 ₾" ? "216 ₾" : plan.price === "500 ₾" ? "625 ₾" : plan.price}
                         </span>
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {t("limitedTime")}
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

               <CardContent className="pt-0 flex flex-col flex-grow">
                 <ul className="space-y-3 mb-8 flex-grow">
                   {plan.features.map((feature, featureIndex) => (
                     <li key={featureIndex} className="flex items-start">
                       <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                       <span className="text-muted-foreground">{feature}</span>
                     </li>
                   ))}
                 </ul>

                 <Button
                   className="w-full mt-auto bg-primary hover:bg-primary/90"
                   size="lg"
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     handleButtonClick(plan.cta);
                   }}
                   type="button"
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
                 href="mailto:info@suliko.ge"
                 className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
               >
                 <div className="p-2 bg-primary/10 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
                   <Mail className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="font-medium text-foreground">{t("contactModal.email")}</p>
                   <p className="text-sm text-muted-foreground">info@suliko.ge</p>
                 </div>
               </a>

               <a
                 href="tel:+995591729911"
                 className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
               >
                 <div className="p-2 bg-primary/10 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
                   <Phone className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="font-medium text-foreground">{t("contactModal.phone")}</p>
                   <p className="text-sm text-muted-foreground">+995 591 729 911</p>
                 </div>
               </a>

               <a
                 href="https://wa.me/995591729911"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
               >
                 <div className="p-2 bg-green-500/10 rounded-full mr-4 group-hover:bg-green-500/20 transition-colors">
                   <MessageCircle className="h-5 w-5 text-green-500" />
                 </div>
                 <div>
                   <p className="font-medium text-foreground">{t("contactModal.whatsapp")}</p>
                   <p className="text-sm text-muted-foreground">+995 591 729 911</p>
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
     </section>
   );
 }
