"use client";

import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  { nameKey: "t1name", roleKey: "t1role", textKey: "t1text", initials: "NB" },
  { nameKey: "t2name", roleKey: "t2role", textKey: "t2text", initials: "GM" },
  { nameKey: "t3name", roleKey: "t3role", textKey: "t3text", initials: "AK" },
  { nameKey: "t4name", roleKey: "t4role", textKey: "t4text", initials: "DT" },
] as const;

export default function NotaryTestimonialsSection() {
  const t = useTranslations("NotaryPage.testimonials");

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
            <Star className="h-3.5 w-3.5 fill-current" />
            {t("sectionBadge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {TESTIMONIALS.map(({ nameKey, roleKey, textKey, initials }) => (
            <div
              key={nameKey}
              className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors duration-200"
            >
              <Quote className="absolute top-5 right-5 h-6 w-6 text-primary/20" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                &ldquo;{t(textKey)}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--suliko-default-color)] text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(nameKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(roleKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
