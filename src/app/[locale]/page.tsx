import { redirect } from "@/i18n/navigation";
import { HOME_PRODUCT } from "@/shared/constants/products";
import MerchantHeader from "@/shared/components/merchant/MerchantHeader";
import MerchantHero from "@/shared/components/merchant/MerchantHero";
import MerchantHowItWorks from "@/shared/components/merchant/MerchantHowItWorks";
import MerchantFeatures from "@/shared/components/merchant/MerchantFeatures";
import MerchantOfficeSection from "@/shared/components/merchant/MerchantOfficeSection";
import MerchantDevelopers from "@/shared/components/merchant/MerchantDevelopers";
import MerchantClosingCta from "@/shared/components/merchant/MerchantClosingCta";
import MerchantFooter from "@/shared/components/merchant/MerchantFooter";
import PricingSection from "@/shared/components/PricingSection";
import LandingClientExtras from "./translate/_LandingClientExtras";

/**
 * The site address on its own is not a page of either product. For Georgian and
 * Polish, middleware already sends it on to HOME_PRODUCT (keeping the query
 * string); this is just the fallback for any request that reaches the route
 * without passing through middleware.
 *
 * English is the one exception, and middleware knows to leave it alone: this is
 * where the international landing page actually lives — one document moving
 * through upload, translate, format-in-Suliko and export in the core app, then
 * into Suliko Office, then a look at the API. Office and Translate both keep
 * their own full pages untouched; this is the overview in front of them, built
 * to feature the promo video (silent loop as the hero background, full narrated
 * cut in a lightbox on "Watch the full video"). See memory note
 * "suliko-merchant-site" for the brief.
 *
 * Real pricing (`PricingSection`) is reused as-is rather than restyled, so the
 * numbers shown are never a copy that can drift from the one place they're
 * actually maintained.
 */
export default async function LocaleRoot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (locale !== "en") {
    redirect({ href: `/${HOME_PRODUCT}`, locale });
    return null;
  }

  return (
    <div id="top" className="min-h-screen bg-background">
      <MerchantHeader />
      <main>
        <MerchantHero />
        <MerchantHowItWorks />
        <MerchantFeatures />
        <MerchantOfficeSection />
        <MerchantDevelopers />
        <PricingSection />
        <MerchantClosingCta />
      </main>
      <MerchantFooter />
      <LandingClientExtras />
    </div>
  );
}
