"use client";

import { Card, CardContent } from "@/features/ui";
import { Star, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Captcha from "./Captcha";
import { useTheme } from "next-themes";

export default function TestimonialsSection() {
  const t = useTranslations("TestimonialsSection");
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testimonials = [
    {
      name: t("testimonials.translationHouse.name"),
      role: t("testimonials.translationHouse.role"),
      company: t("testimonials.translationHouse.company"),
      avatar: "თს",
      rating: 5,
      content: t("testimonials.translationHouse.content"),
    },
    {
      name: t("testimonials.irakliVekua.name"),
      role: t("testimonials.irakliVekua.role"),
      company: t("testimonials.irakliVekua.company"),
      avatar: "ივ",
      rating: 5,
      content: t("testimonials.irakliVekua.content"),
    },
    {
      name: t("testimonials.iuristi.name"),
      role: t("testimonials.iuristi.role"),
      company: t("testimonials.iuristi.company"),
      avatar: "IG",
      rating: 5,
      content: t("testimonials.iuristi.content"),
    },
    {
      name: t("testimonials.nebulaAI.name"),
      role: t("testimonials.nebulaAI.role"),
      company: t("testimonials.nebulaAI.company"),
      avatar: "NA",
      rating: 5,
      content: t("testimonials.nebulaAI.content"),
    },
    {
      name: t("testimonials.api24.name"),
      role: t("testimonials.api24.role"),
      company: t("testimonials.api24.company"),
      avatar: "A24",
      rating: 5,
      content: t("testimonials.api24.content"),
    },
  ];

  const getAvatarColor = (initials: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    return colors[initials.charCodeAt(0) % colors.length];
  };

  const handleCaptchaVerify = (token: string | null) => setCaptchaToken(token);
  const handleCaptchaError = (error?: unknown) => {
    console.error('CAPTCHA error:', error);
    setCaptchaToken(null);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !captchaToken) { setSubmitStatus('error'); return; }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setEmail('');
      setCaptchaToken(null);
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate for seamless loop
  const allCards = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Stats — compact inline row */}
        <div className="flex flex-wrap gap-8 justify-center mb-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">4.9/5</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("stats.averageRating")}</div>
          </div>
          <div className="w-px bg-border/60 hidden sm:block" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">50K+</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("stats.happyCustomers")}</div>
          </div>
          <div className="w-px bg-border/60 hidden sm:block" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">98%</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("stats.customerSatisfaction")}</div>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative pause-on-hover">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-muted/30 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-muted/30 to-transparent" />

          <div className="overflow-hidden">
            <div className="animate-marquee flex gap-5 w-max">
              {allCards.map((testimonial, index) => (
                <Card
                  key={index}
                  className="w-72 h-96 shrink-0 border border-border/60 rounded-2xl bg-card"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Quote + Stars */}
                    <div className="flex items-center justify-between mb-3">
                      <Quote className="h-6 w-6 text-primary/20" />
                      <div className="flex gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Content — grows to fill space, pushing author to bottom */}
                    <p className="flex-1 min-h-0 overflow-y-auto text-sm text-muted-foreground leading-relaxed mb-4 pr-1">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>

                    {/* Author — always at bottom */}
                    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/40">
                      <div className={`w-9 h-9 rounded-full ${getAvatarColor(testimonial.avatar)} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                        {testimonial.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl py-16 px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                {t("newsletter.title")}
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                {t("newsletter.subtitle")}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("newsletter.emailPlaceholder")}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!email || !captchaToken || isSubmitting}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t("newsletter.subscribing") : t("newsletter.subscribeButton")}
                  </button>
                </div>

                <div className="flex justify-center">
                  <Captcha
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                    size="normal"
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    {t("newsletter.success")}
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="text-destructive text-sm font-medium">
                    {t("newsletter.error")}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
