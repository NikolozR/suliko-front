import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import LandingHeader from "@/shared/components/LandingHeader";
import AuroraBackground from "@/shared/components/AuroraBackground";
import LandingFooter from "@/shared/components/LandingFooter";

function parseDocumentSections(text: string) {
  const blocks = text.split(/\n\n+/);
  const sections: { heading: string | null; body: string }[] = [];
  let current: { heading: string | null; body: string } | null = null;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const isHeading =
      /^\d+\.\s/.test(trimmed) && trimmed.split("\n").length === 1;
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: trimmed, body: "" };
    } else {
      if (current) current.body += (current.body ? "\n\n" : "") + trimmed;
      else sections.push({ heading: null, body: trimmed });
    }
  }
  if (current) sections.push(current);
  return sections;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Terms");
  const domain =
    locale === "ka"
      ? "https://suliko.ge"
      : locale === "en"
      ? "https://suliko.io"
      : "https://suliko.ge/pl";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: `${domain}/terms` },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      type: "website",
    },
  };
}

export default async function TermsPage() {
  const tTerms = await getTranslations("Terms");
  const tAuth = await getTranslations("Authorization");
  const sections = parseDocumentSections(tAuth("termsText"));

  return (
    <>
      <LandingHeader />

      <main className="min-h-screen">
        <AuroraBackground />

        <div className="relative z-10 pt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              {tTerms("backToHome")}
            </Link>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {tAuth("termsAndConditions")}
            </h1>
            <p className="text-xs text-muted-foreground mb-10">
              შკს სულიკო ეი აი · ID: 400403265
            </p>

            <div className="max-w-3xl space-y-6">
              {sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2 className="font-semibold text-foreground mb-2">
                      {section.heading}
                    </h2>
                  )}
                  {section.body && (
                    <p className="text-muted-foreground leading-7 whitespace-pre-wrap text-sm">
                      {section.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
