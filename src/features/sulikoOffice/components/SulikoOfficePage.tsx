import LandingFooter from "@/shared/components/LandingFooter";
import OfficeHeader from "./OfficeHeader";
import OfficeHero from "./OfficeHero";
import OfficePains from "./OfficePains";
import OfficeJourney from "./OfficeJourney";
import OfficeFeatures from "./OfficeFeatures";
import OfficeProof from "./OfficeProof";
import OfficeSecurity from "./OfficeSecurity";
import OfficeFaq from "./OfficeFaq";
import OfficeDemoSection from "./OfficeDemoSection";
import OfficeSpotlight from "./OfficeSpotlight";
import NewOrderDemo from "./demo/NewOrderDemo";
import PayoutsDemo from "./demo/PayoutsDemo";

/**
 * Landing page for Suliko Office, the translation management system at
 * app.suliko.ge. Server-rendered, apart from the header (language switch,
 * mobile menu), the four product demos and the demo-request form.
 */
export default function SulikoOfficePage() {
  return (
    <div id="top" className="office-page min-h-screen text-foreground">
      <OfficeHeader />
      <main>
        <OfficeHero />
        <OfficePains />
        <OfficeSpotlight id="pricing" demo={<NewOrderDemo />} />
        <OfficeJourney />
        <OfficeFeatures />
        <OfficeSpotlight id="payouts" demo={<PayoutsDemo />} reverse />
        <OfficeProof />
        <OfficeSecurity />
        <OfficeFaq />
        <OfficeDemoSection />
      </main>
      <LandingFooter />
    </div>
  );
}
