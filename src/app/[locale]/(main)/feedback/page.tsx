import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FeedbackPageClient from "@/features/feedback/components/FeedbackPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("feedback") };
}

export default function FeedbackPage() {
  return <FeedbackPageClient />;
}

