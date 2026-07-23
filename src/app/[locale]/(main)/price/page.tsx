import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PricingGrid } from "@/features/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("pricing") };
}

export default function PricePackages() {
  const t = useTranslations("Pricing");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 mt-10 text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground text-lg">{t("description")}</p>
      </div>
      
      <PricingGrid />
    </div>
  );
}
