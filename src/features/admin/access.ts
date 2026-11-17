import "server-only";

import { isAdminRequest } from "@/lib/admin-auth";
import { getSession } from "@office/shared/auth/session";
import { translateMessages } from "@/shared/i18n/translateMessages";

/**
 * What this person may open in the one admin console. Two checks stay behind
 * the one door: suliko.ge's own (the API's verdict on the `token` cookie) for
 * users, referrals, promo codes, languages, blog and passport templates; and
 * Office's superuser permission for workspaces and platform billing.
 */
export interface AdminAccess {
  translate: boolean;
  office: boolean;
}

export async function adminAccess(): Promise<AdminAccess> {
  const [translate, session] = await Promise.all([
    isAdminRequest().catch(() => false),
    getSession().catch(() => null),
  ]);
  return { translate, office: Boolean(session?.permissions.includes("platform.tenants")) };
}

/** The navigation's words, as plain strings: Office's layout loads only Office's messages. */
export async function adminNavLabels(locale: string): Promise<Record<string, string>> {
  const all = await translateMessages(locale, ["AdminNav"]);
  return (all.AdminNav ?? {}) as Record<string, string>;
}
