import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DocumentTranslationPage from "@/features/translation/components/DocumentTranslationPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("document") };
}

export default function DocumentPage() {
  return <DocumentTranslationPage />;
} 