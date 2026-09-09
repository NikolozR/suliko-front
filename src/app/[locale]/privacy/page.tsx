import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalDocumentPage from "@/shared/components/LegalDocumentPage";
import { canonicalFor } from "@/shared/utils/legalPageMeta";
import {
  COMPANY_ADDRESS_EN,
  COMPANY_ADDRESS_KA,
  COMPANY_EMAIL,
  COMPANY_NAME_EN,
  COMPANY_NAME_KA,
} from "@/shared/constants/company";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Privacy");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: canonicalFor(locale, "/privacy") },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      type: "website",
    },
  };
}

/**
 * What we collect, why, how long we keep it, and what a user can ask us to do
 * with it.
 */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Privacy");

  const body = t("body", {
    name: locale === "ka" ? COMPANY_NAME_KA : COMPANY_NAME_EN,
    email: COMPANY_EMAIL,
    address: locale === "ka" ? COMPANY_ADDRESS_KA : COMPANY_ADDRESS_EN,
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
