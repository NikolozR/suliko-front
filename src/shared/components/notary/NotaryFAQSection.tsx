"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/features/ui";
import { DEFAULT_PRICING, fillPricingTokens } from "@/shared/utils/notaryPricing";

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

  /**
   * Answers carry pricing tokens so they track the config instead of drifting
   * from it. The same resolved text feeds the FAQPage structured data below,
   * so search results and the page can never disagree.
   */
  const items = FAQ_ITEMS.map(({ q, a }) => ({
    question: fillPricingTokens(t(q), DEFAULT_PRICING),
    answer: fillPricingTokens(t(a), DEFAULT_PRICING),
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <section id="faq" className="bg-background py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {t("sectionBadge")}
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("subheading")}
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {items.map(({ question, answer }, index) => (
              <AccordionItem key={question} value={`item-${index}`}>
                <AccordionTrigger className="text-base">{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
