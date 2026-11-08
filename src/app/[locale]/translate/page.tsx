import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { canonicalFor } from "@/shared/utils/legalPageMeta";
import { FAQ_KEYS } from "@/shared/constants/faqKeys";
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

/** FAQPage structured data built from the same messages as the visible FAQ, so it is in the page's language. */
async function getFaqSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: t(`items.${key}.question`),
      acceptedAnswer: { "@type": "Answer", text: t(`items.${key}.answer`) },
    })),
  };
}

export default async function TranslatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const faqSchema = await getFaqSchema(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div id="top" className="min-h-screen bg-background">
        <LandingHeader />
        <main id="main-content">
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
