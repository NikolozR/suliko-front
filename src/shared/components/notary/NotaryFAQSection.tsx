"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/features/ui";

const FAQ_ITEMS = [
  { q: "q1", a: "a1" },
  { q: "q2", a: "a2" },
  { q: "q3", a: "a3" },
  { q: "q4", a: "a4" },
  { q: "q5", a: "a5" },
  { q: "q6", a: "a6" },
] as const;

export default function NotaryFAQSection() {
  const t = useTranslations("NotaryPage.faq");

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
            {t("sectionBadge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map(({ q, a }, index) => (
              <AccordionItem key={q} value={`item-${index}`}>
                <AccordionTrigger className="text-base">
                  {t(q)}
                </AccordionTrigger>
                <AccordionContent>
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
