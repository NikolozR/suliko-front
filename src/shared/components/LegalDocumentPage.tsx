import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import LandingHeader from "@/shared/components/LandingHeader";
import AuroraBackground from "@/shared/components/AuroraBackground";
import LandingFooter from "@/shared/components/LandingFooter";
import { parseDocumentSections } from "@/shared/utils/parseDocumentSections";
import {
  COMPANY_ID,
  COMPANY_NAME_EN,
  COMPANY_NAME_KA,
} from "@/shared/constants/company";

interface LegalDocumentPageProps {
  /** Heading shown above the document. */
  title: string;
  /** The document itself, in the section format parseDocumentSections expects. */
  body: string;
  /** Optional lead paragraph, set unheaded above the first section. */
  intro?: string;
  /** When the document was last revised, already formatted for display. */
  lastUpdated?: string;
  locale: string;
}

/**
 * Shared shell for the public legal documents — terms, privacy, refunds, about.
 *
 * Payment providers check these pages before lifting a merchant's limit, so they
 * carry the registered entity and code under every title.
 */
export default async function LegalDocumentPage({
  title,
  body,
  intro,
  lastUpdated,
  locale,
}: LegalDocumentPageProps) {
  const t = await getTranslations("Terms");
  const sections = parseDocumentSections(body);

  // Georgian readers get the registered name on its own; everyone else gets the
  // readable form with the registered one alongside it.
  const entity =
    locale === "ka"
      ? COMPANY_NAME_KA
      : `${COMPANY_NAME_EN} (${COMPANY_NAME_KA})`;

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
              {t("backToHome")}
            </Link>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {entity} · ID: {COMPANY_ID}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">{lastUpdated}</p>
            )}

            <div className="max-w-3xl space-y-6 mt-10">
              {intro && (
                <p className="text-muted-foreground leading-7 whitespace-pre-wrap text-sm">
                  {intro}
                </p>
              )}
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
