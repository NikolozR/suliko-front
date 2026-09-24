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
  const t = await getTranslations("About");

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: canonicalFor(locale, "/about") },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      type: "website",
    },
  };
}

/**
 * Who we are, what the service does, and how to reach us.
 *
 * Card processors require all three to be readable on the site before a merchant
 * comes off its starting limit, which is why the contact details are spelled out
 * here rather than only in the footer.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("About");

  const body = t("body", {
    name: locale === "ka" ? COMPANY_NAME_KA : COMPANY_NAME_EN,
    id: COMPANY_ID,
    email: COMPANY_EMAIL,
    phone: COMPANY_PHONE_DISPLAY,
    address: locale === "ka" ? COMPANY_ADDRESS_KA : COMPANY_ADDRESS_EN,
  });

  return (
    <LegalDocumentPage
      title={t("title")}
      intro={t("intro")}
      body={body}
      locale={locale}
    />
  );
}
