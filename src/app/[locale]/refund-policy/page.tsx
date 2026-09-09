import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalDocumentPage from "@/shared/components/LegalDocumentPage";
import { canonicalFor } from "@/shared/utils/legalPageMeta";
import { COMPANY_EMAIL, COMPANY_PHONE_DISPLAY } from "@/shared/constants/company";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("RefundPolicy");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: canonicalFor(locale, "/refund-policy") },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      type: "website",
    },
  };
}

/**
 * How a purchase is delivered, and how it can be cancelled or refunded.
 *
 * Delivery matters even though nothing ships: the processor's checklist asks for
 * it, and for a service billed in credits the honest answer is that delivery is
 * immediate, which is also what sets up the refund terms.
 */
export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("RefundPolicy");

  const body = t("body", {
    email: COMPANY_EMAIL,
    phone: COMPANY_PHONE_DISPLAY,
  });

  return (
    <LegalDocumentPage
      title={t("title")}
      intro={t("intro")}
      body={body}
      lastUpdated={t("lastUpdated")}
      locale={locale}
    />
  );
}
