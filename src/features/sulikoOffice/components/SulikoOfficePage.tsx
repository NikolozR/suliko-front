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

/**
 * Landing page for Suliko Office, the translation management system at
 * app.suliko.ge. Everything above the footer is server-rendered; only the
 * header (language switch, mobile menu) and the demo form ship JS.
 */
export default function SulikoOfficePage() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <OfficeHeader />
      <main>
        <OfficeHero />
        <OfficePains />
        <OfficeJourney />
        <OfficeFeatures />
        <OfficeProof />
        <OfficeSecurity />
        <OfficeFaq />
        <OfficeDemoSection />
      </main>
      <LandingFooter />
    </div>
  );
}
