"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { api, ApiError } from "@office/shared/lib/api";

/**
 * Two-factor enrolment and management — `api/v1/mfa.py`.
 *
 * Used by the Account screen and by the setup screen a privileged account is
 * held at when its role requires a factor it does not have yet. The API
 * accepts the second case (an MFA-pending session with no factor) for enrol
 * and confirm only.
 */

export interface EnrolmentStart {
  secret: string;
  otpauthUri: string;
  qrSvg: string;
}

export interface MfaActionState {
  error?: string;
  /** Shown once, after confirm or regenerate. */
  recoveryCodes?: string[];
  /** Set after a successful disable. */
  disabled?: boolean;
}

function message(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return error.detail;
    if (error.status === 429) return error.detail;
    if (error.status < 500) return error.detail;
  }
  return fallback;
}

export async function startEnrolmentAction(
  locale: string,
): Promise<{ data?: EnrolmentStart; error?: string }> {
  const t = await getTranslations({ locale, namespace: "auth.mfa" });
  try {
    const out = await api<{ secret: string; otpauth_uri: string; qr_svg: string }>(
      "/api/v1/auth/mfa/enrol",
      { method: "POST" },
    );
    return { data: { secret: out.secret, otpauthUri: out.otpauth_uri, qrSvg: out.qr_svg } };
  } catch (error) {
    return { error: message(error, t("startError")) };
  }
}

export async function confirmEnrolmentAction(
  _previous: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  const locale = String(formData.get("locale") ?? "ka");
  const t = await getTranslations({ locale, namespace: "auth.errors" });
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: t("enterCode") };

  try {
    const out = await api<{ recovery_codes: string[] }>("/api/v1/auth/mfa/confirm", {
      method: "POST",
      body: { code },
    });
    revalidatePath("/", "layout");
    return { recoveryCodes: out.recovery_codes };
  } catch (error) {
    return { error: message(error, t("unreachable")) };
  }
}

export async function regenerateRecoveryCodesAction(
  _previous: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  const locale = String(formData.get("locale") ?? "ka");
  const t = await getTranslations({ locale, namespace: "auth.errors" });
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: t("enterCode") };

  try {
    const out = await api<{ recovery_codes: string[] }>("/api/v1/auth/mfa/recovery-codes", {
      method: "POST",
      body: { code },
    });
    return { recoveryCodes: out.recovery_codes };
  } catch (error) {
    return { error: message(error, t("unreachable")) };
  }
}

export async function disableMfaAction(
  _previous: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  const locale = String(formData.get("locale") ?? "ka");
  const t = await getTranslations({ locale, namespace: "auth.errors" });
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: t("enterCode") };

  try {
    await api("/api/v1/auth/mfa/disable", { method: "POST", body: { code } });
  } catch (error) {
    return { error: message(error, t("unreachable")) };
  }
  revalidatePath("/", "layout");
  return { disabled: true };
}
