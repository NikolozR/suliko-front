// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ClientMessages } from "@office/i18n/client-messages";

/** This section's client components need onboarding on top of the shared set. */
export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} extra={["onboarding"]}>
      {children}
    </ClientMessages>
  );
}
