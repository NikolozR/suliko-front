import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PricingGrid } from "@/features/pricing";
import CompanyLegalInfo from "@/shared/components/CompanyLegalInfo";
import { CouponRedeemCard } from "@/features/promoCodes";

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
  const tCoupon = useTranslations("Coupon");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 mt-10 text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground text-lg">{t("description")}</p>
      </div>
      
      <PricingGrid />

      {/* Below the plans: it is for people who already have a code, and
          it used to sit above the plans and be the first thing on the page.
          Renders nothing when signed out, so the fold is empty then too. */}
      <details className="group mx-auto mt-10 max-w-xl">
        <summary className="cursor-pointer text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {tCoupon("title")}
        </summary>
        <CouponRedeemCard className="mt-4" />
      </details>

      <CompanyLegalInfo className="mt-12 text-center" />
    </div>
  );
}
