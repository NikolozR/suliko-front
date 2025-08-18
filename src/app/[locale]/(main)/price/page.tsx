import { useTranslations } from "next-intl";
import { PricingGrid } from "@/features/pricing";

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
