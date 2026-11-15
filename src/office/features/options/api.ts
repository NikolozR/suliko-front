// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/** A bureau's own additions to a dropdown — `api/v1/options.py`. */
export type OptionListKey = "acquisition_source" | "order_status";

export interface CustomOption {
  id: number;
  value: string;
}

export async function listOptions(list: OptionListKey): Promise<CustomOption[]> {
  return api<CustomOption[]>(`/api/v1/options/${list}`);
}

export async function addOption(list: OptionListKey, value: string): Promise<CustomOption> {
  return api<CustomOption>(`/api/v1/options/${list}`, { method: "POST", body: { value } });
}

export async function deleteOption(list: OptionListKey, id: number): Promise<void> {
  await api<void>(`/api/v1/options/${list}/${id}`, { method: "DELETE" });
}
