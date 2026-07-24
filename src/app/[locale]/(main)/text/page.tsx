import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TextTranslationPage from "@/features/translation/components/TextTranslationPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("text") };
}

export default function TextPage() {
  return <TextTranslationPage />;
} 