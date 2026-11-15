"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { upgradeBillingPackage } from "@office/features/billing/api";
import { describeApiError } from "@office/shared/lib/form-state";
import { revalidateRoute } from "@office/shared/lib/revalidate";

export interface UpgradeFormState {
  error?: string;
  ok?: boolean;
}

/**
 * Move up to a bigger package, after the terms were shown and ticked.
 *
 * The API refuses without the tick, with a terms version it no longer holds, and
 * for a smaller package or one with no listed price; its sentence is passed on.
 * The package changes at once, so every screen that shows the figure is refreshed.
 */
export async function upgradePackageAction(
  _previous: UpgradeFormState,
  formData: FormData,
): Promise<UpgradeFormState> {
  const tier = Number(formData.get("tier"));
  const termsVersion = String(formData.get("terms_version") ?? "");
  if (![1, 2, 3].includes(tier) || !termsVersion) {
    return { error: (await getTranslations("validation"))("missingId") };
  }
  if (formData.get("accepted_terms") !== "on") {
    return { error: (await getTranslations("billing.upgrade"))("tick") };
  }

  try {
    await upgradeBillingPackage({ tier, accepted_terms: true, terms_version: termsVersion });
  } catch (error) {
    return await describeApiError(error, "package");
  }

  revalidateRoute("/billing", "page");
  revalidateRoute("/", "layout");
  return { ok: true };
}
