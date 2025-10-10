"use client";

import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/features/ui";
import { Star, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TestimonialsSection() {
  const t = useTranslations("TestimonialsSection");
  const testimonials = [
    {
      name: t("testimonials.translationHouse.name"),
      role: t("testimonials.translationHouse.role"),
      company: t("testimonials.translationHouse.company"),
      avatar: "თს",
      rating: 5,
      content: t("testimonials.translationHouse.content")
    },
    {
      name: t("testimonials.irakliVekua.name"),
      role: t("testimonials.irakliVekua.role"),
      company: t("testimonials.irakliVekua.company"),
      avatar: "ივ",
      rating: 5,
      content: t("testimonials.irakliVekua.content")
    },
    {
      name: t("testimonials.iuristi.name"),
      role: t("testimonials.iuristi.role"),
      company: t("testimonials.iuristi.company"),
      avatar: "IG",
      rating: 5,
      content: t("testimonials.iuristi.content")
    },
    {
      name: t("testimonials.nebulaAI.name"),
      role: t("testimonials.nebulaAI.role"),
      company: t("testimonials.nebulaAI.company"),
      avatar: "NA",
      rating: 5,
      content: t("testimonials.nebulaAI.content")
    },
    {
      name: t("testimonials.api24.name"),
      role: t("testimonials.api24.role"),
      company: t("testimonials.api24.company"),
      avatar: "A24",
      rating: 5,
      content: t("testimonials.api24.content")
    }
  ];

  const getAvatarColor = (initials: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500"
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-sm text-muted-foreground">{t("stats.averageRating")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">{t("stats.happyCustomers")}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">{t("stats.customerSatisfaction")}</div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="flex justify-start mb-4">
                  <Quote className="h-8 w-8 text-primary/20" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(testimonial.avatar)} flex items-center justify-center text-white font-semibold mr-4`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-primary font-medium">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t("cta.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("cta.subtitle")}
            </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link href="/document">
                 <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                   {t("cta.startTrial")}
                 </button>
               </Link>
               <a href="#contact">
                 <button className="border border-border text-foreground px-8 py-3 rounded-lg font-medium hover:bg-accent transition-colors">
                   {t("cta.contactSales")}
                 </button>
               </a>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
