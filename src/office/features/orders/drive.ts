// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/** Mirrors `POST /orders/{id}/drive/sync`: copy what is not in Google Drive yet. */
export interface DriveSync {
  /** False: the organisation has no Google Drive connected. */
  connected: boolean;
  copied: number;
  /** Files still not in Drive after this run. */
  failed: number;
  drive_folder_url: string | null;
}

export async function syncOrderToDrive(orderId: number): Promise<DriveSync> {
  return api<DriveSync>(`/api/v1/orders/${orderId}/drive/sync`, { method: "POST" });
}
