// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Integration } from "@office/features/settings/integrations";

// What Settings offers: the bank, both entries (client payment links, and
// payouts to translators and notaries), and Google Drive (a copy of every
// order's files in a shared folder). Everything else (SmsOffice, Email
// SMTP, ElevenLabs, reCAPTCHA, API24) is kept out of the list
// rather than deleted from the API, so a tenant that already configured one
// keeps working and bringing one back is a one-line change here.
//
// Hiding Email (SMTP) means a bureau can no longer SET UP sending documents
// from its own mail address; one that already did keeps sending that way,
// and Suliko's own mail path is unaffected.
const SHOWN_PROVIDERS = new Set<Integration["provider"]>([
  "bog_ecommerce",
  "bog_business",
  "google_drive",
]);

/** The integrations Settings offers. None at all, and the tab is not shown. */
export function visibleIntegrations(integrations: readonly Integration[]): Integration[] {
  return integrations.filter((integration) => SHOWN_PROVIDERS.has(integration.provider));
}
