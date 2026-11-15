"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { revalidateRoute } from "@office/shared/lib/revalidate";

import {
  checkIntegration,
  removeIntegration,
  saveIntegration,
  type IntegrationProvider,
} from "@office/features/settings/integrations";
import { describeApiError } from "@office/shared/lib/form-state";

/**
 * Integration mutations.
 *
 * Nothing here logs, echoes or returns a submitted secret — not into
 * `values` for a failed-submit repopulate, not into an error message. A form
 * that re-renders with the typed secret in its HTML has undone the point of
 * never returning one, and an action that echoes on validation failure is the
 * easy way to do that by accident.
 */

export interface IntegrationFormState {
  error?: string;
  ok?: boolean;
  /** Non-secret values only, for repopulating after a failed submit. */
  values?: Record<string, string>;
  check?: { ok: boolean; detail: string   /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
};
}

export async function saveIntegrationAction(
  _previous: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const provider = String(formData.get("provider") ?? "") as IntegrationProvider;
  if (!provider) return { error: (await getTranslations("validation"))("missingId") };

  // The form declares which of its fields are secret, so this action does not
  // need its own copy of the registry — and cannot disagree with it.
  const secretKeys = new Set(String(formData.get("__secret_keys") ?? "").split(",").filter(Boolean));

  const config: Record<string, unknown> = {};
  const secrets: Record<string, string> = {};
  const echo: Record<string, string> = {};

  for (const [key, raw] of formData.entries()) {
    if (key.startsWith("__") || key === "provider" || key === "is_enabled") continue;
    const value = typeof raw === "string" ? raw : "";

    if (secretKeys.has(key)) {
      // Blank means "keep the stored one". Sending "" would overwrite it.
      if (value.trim()) secrets[key] = value;
      continue;
    }

    config[key] = value;
    echo[key] = value;
  }

  try {
    await saveIntegration(provider, {
      is_enabled: formData.get("is_enabled") !== null,
      config,
      secrets,
    });
  } catch (error) {
    // `echo` deliberately excludes every secret.
    return { ...(await describeApiError(error, "integration")), values: echo };
  }

  revalidateRoute("/settings");
  return { ok: true, values: echo };
}

export async function checkIntegrationAction(
  _previous: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const provider = String(formData.get("provider") ?? "") as IntegrationProvider;
  if (!provider) return { error: (await getTranslations("validation"))("missingId") };

  try {
    const check = await checkIntegration(provider);
    revalidateRoute("/settings");
    return { check };
  } catch (error) {
    return await describeApiError(error, "integration");
  }
}

export async function removeIntegrationAction(
  _previous: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const provider = String(formData.get("provider") ?? "") as IntegrationProvider;
  if (!provider) return { error: (await getTranslations("validation"))("missingId") };

  try {
    await removeIntegration(provider);
  } catch (error) {
    return await describeApiError(error, "integration");
  }

  revalidateRoute("/settings");
  return { ok: true };
}
