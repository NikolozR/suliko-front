import { Suspense } from "react";
import type { Metadata } from "next";

import AuroraBackground from "@/shared/components/AuroraBackground";
import OfficeSignOut from "@/features/sulikoOffice/components/OfficeSignOut";

export const metadata: Metadata = {
  title: "Sign out | Suliko",
  robots: { index: false, follow: false },
};

/** Sign-out from Suliko Office, carried on to suliko.ge. See OfficeSignOut. */
export default function OfficeSignOutPage() {
  return (
    <div className="relative flex justify-center items-center min-h-[100dvh] w-full overflow-y-auto">
      <AuroraBackground />
      <div className="relative flex items-center justify-center w-full min-h-[100dvh]">
        <Suspense fallback={null}>
          <OfficeSignOut />
        </Suspense>
      </div>
    </div>
  );
}
