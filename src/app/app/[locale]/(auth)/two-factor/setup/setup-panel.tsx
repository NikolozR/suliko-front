"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { MfaEnrolment } from "@office/features/account/components/mfa-enrolment";
import { useRouter } from "@office/i18n/navigation";

/** Enrol, then carry on to wherever sign-in was going. */
export function SetupPanel({ next }: { next: string }) {
  const router = useRouter();
  return (
    <MfaEnrolment
      onFinished={() => {
        router.replace(next);
        router.refresh();
      }}
    />
  );
}
