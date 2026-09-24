import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalDocumentPage from "@/shared/components/LegalDocumentPage";
import { canonicalFor } from "@/shared/utils/legalPageMeta";
import {
  COMPANY_ADDRESS_EN,
  COMPANY_ADDRESS_KA,
  COMPANY_EMAIL,
  COMPANY_ID,
  COMPANY_NAME_EN,
  COMPANY_NAME_KA,
  COMPANY_PHONE_DISPLAY,
} from "@/shared/constants/company";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Terms");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: canonicalFor(locale, "/terms") },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      type: "website",
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tTerms = await getTranslations("Terms");
  const tAuth = await getTranslations("Authorization");

  // Company details are interpolated from constants/company.ts rather than written
  // into the translations, so the entity named here matches the one on every other
  // page and the one registered with the payment provider.
  const body = tAuth("termsText", {
    name: locale === "ka" ? COMPANY_NAME_KA : COMPANY_NAME_EN,
    id: COMPANY_ID,
    email: COMPANY_EMAIL,
    phone: COMPANY_PHONE_DISPLAY,
    address: locale === "ka" ? COMPANY_ADDRESS_KA : COMPANY_ADDRESS_EN,
  });

  return (
    <LegalDocumentPage
      title={tAuth("termsAndConditions")}
      body={body}
      lastUpdated={tTerms("lastUpdated")}
      locale={locale}
    />
  );
}
