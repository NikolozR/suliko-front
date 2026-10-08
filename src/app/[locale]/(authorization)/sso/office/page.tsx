import { Suspense } from "react";
import type { Metadata } from "next";

import AuroraBackground from "@/shared/components/AuroraBackground";
import OfficeSsoGateway from "@/features/sulikoOffice/components/OfficeSsoGateway";

export const metadata: Metadata = {
  title: "Suliko Office | Suliko",
  robots: { index: false, follow: false },
};

/** Sign-in to Suliko Office (app.suliko.ge) through suliko.ge. See OfficeSsoGateway. */
export default function OfficeSsoPage() {
  return (
    <div className="relative flex justify-center items-center min-h-[100dvh] w-full overflow-y-auto">
      <AuroraBackground />
      <div className="relative flex items-center justify-center w-full min-h-[100dvh]">
        <Suspense fallback={null}>
          <OfficeSsoGateway />
        </Suspense>
      </div>
    </div>
  );
}
