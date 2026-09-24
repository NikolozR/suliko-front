import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SulikoOfficePage from "@/features/sulikoOffice/components/SulikoOfficePage";
import { FAQ_KEYS } from "@/features/sulikoOffice/components/OfficeFaq";
import { canonicalFor } from "@/shared/utils/legalPageMeta";

const PATH = "/tms";

/**
 * The page is written in Georgian and English only. Polish visitors get the
 * English copy, so /pl/tms points its canonical at the English page rather
 * than competing with it as a duplicate.
 */
function canonicalLocale(locale: string): "ka" | "en" {
  return locale === "ka" ? "ka" : "en";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SulikoOffice.meta" });
  const canonical = canonicalFor(canonicalLocale(locale), PATH);

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        ka: canonicalFor("ka", PATH),
        en: canonicalFor("en", PATH),
        "x-default": canonicalFor("ka", PATH),
      },
    },
    openGraph: {
      type: "website",
      siteName: "Suliko",
      url: canonical,
      title: t("title"),
      description: t("description"),
      images: [{ url: "/Suliko_logo_black.svg", width: 1200, height: 630, alt: "Suliko Office" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/Suliko_logo_black.svg"],
    },
  };
}

export default async function TmsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "SulikoOffice" });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Suliko Office",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: canonicalFor(canonicalLocale(locale), PATH),
      description: t("meta.description"),
      publisher: { "@type": "Organization", name: "Suliko", url: "https://suliko.ge" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map((n) => ({
        "@type": "Question",
        name: t(`faq.q${n}`),
        acceptedAnswer: { "@type": "Answer", text: t(`faq.a${n}`) },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <SulikoOfficePage />
    </>
  );
}
