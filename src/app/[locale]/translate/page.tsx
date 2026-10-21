import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { canonicalFor } from "@/shared/utils/legalPageMeta";
import LandingHeader from "@/shared/components/LandingHeader";
import HeroSection from "@/shared/components/HeroSection";
import LandingClientExtras from "./_LandingClientExtras";

// Below the fold: split into their own chunks, but still rendered on the
// server, so the HTML carries every section (crawlers, first paint) and there
// is no skeleton-to-content flash.
const HowItWorksSection = dynamic(() => import("@/shared/components/landing/HowItWorksSection"));
const FeaturesSection = dynamic(() => import("@/shared/components/landing/FeaturesSection"));
const VideoSection = dynamic(() => import("@/shared/components/VideoSection"));
const TestimonialsSection = dynamic(() => import("@/shared/components/TestimonialsSection"));
const PricingSection = dynamic(() => import("@/shared/components/PricingSection"));
const ProductsSection = dynamic(() => import("@/shared/components/landing/ProductsSection"));
const FAQSection = dynamic(() => import("@/shared/components/FAQSection"));
const ClosingCtaSection = dynamic(() => import("@/shared/components/landing/ClosingCtaSection"));
const LandingFooter = dynamic(() => import("@/shared/components/LandingFooter"));

const PATH = "/translate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TranslateMeta" });
  const canonical = canonicalFor(locale, PATH);

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        ka: canonicalFor("ka", PATH),
        en: canonicalFor("en", PATH),
        pl: canonicalFor("pl", PATH),
        "x-default": canonicalFor("ka", PATH),
      },
    },
    openGraph: {
      type: "website",
      siteName: "Suliko",
      url: canonical,
      title: t("title"),
      description: t("description"),
      images: [{ url: "/Suliko_logo_black.svg", width: 1200, height: 630, alt: "Suliko Translate" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/Suliko_logo_black.svg"],
    },
  };
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How accurate are the translations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Suliko uses advanced AI models trained on professional translation corpora. Our accuracy rate is 98% for supported language pairs, and the editor lets you review and refine every segment before finalising your document.",
      },
    },
    {
      "@type": "Question",
      name: "Which languages are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We currently support over 50 languages, including Georgian, English, French, Turkish, Polish, Ukrainian, Arabic, and many more. Georgian is a first-class citizen: our models are specifically fine-tuned for it.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats can I upload?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can upload PNG, JPG, JPEG, PDF, DOCX, and TXT files. The document is parsed automatically and presented in a side-by-side editor so you can see the original alongside the translation.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free tier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every new user receives 10 free pages to translate. After that you can choose a monthly plan (Starter, Professional) or a pay-as-you-go option, whichever suits your workflow.",
      },
    },
    {
      "@type": "Question",
      name: "Is my document data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your documents are encrypted in transit (TLS 1.3) and at rest. We do not use your content to train our models, and you can request permanent deletion of your data at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Why is Suliko especially good for Georgian?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Georgian is a morphologically complex language that most general-purpose AI systems handle poorly. Suliko's models are fine-tuned on Georgian legal, medical, and business texts, resulting in significantly better output than generic translation services.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer an API or business integrations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our Business and Enterprise plans include API access so you can integrate Suliko directly into your own workflows and applications. Contact our sales team for custom volume pricing and SLA options.",
      },
    },
  ],
};

export default function TranslatePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div id="top" className="min-h-screen bg-background">
        <LandingHeader />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <FeaturesSection />
          <VideoSection />
          <TestimonialsSection />
          <PricingSection />
          <FAQSection />
          <ProductsSection />
          <ClosingCtaSection />
        </main>
        <LandingFooter />
        <LandingClientExtras />
      </div>
    </>
  );
}
