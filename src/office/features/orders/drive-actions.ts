"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { syncOrderToDrive, type DriveSync } from "@office/features/orders/drive";

/** The order page's "Copy to Drive" button. A refusal is a sentence, not an error digest. */
export async function syncOrderToDriveAction(
  orderId: number,
): Promise<({ ok: true } & DriveSync) | { ok: false; error: string }> {
  const t = await getTranslations("driveMirror");
  if (!Number.isInteger(orderId) || orderId <= 0) return { ok: false, error: t("unavailable") };
  try {
    return { ok: true, ...(await syncOrderToDrive(orderId)) };
  } catch {
    return { ok: false, error: t("unavailable") };
  }
}
