import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HelpPageClient from "@/features/help/components/HelpPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("help") };
}

export default function HelpPage() {
  return <HelpPageClient />;
}

