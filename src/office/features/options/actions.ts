"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { addOption, deleteOption, type CustomOption, type OptionListKey } from "@office/features/options/api";
import { describeApiError } from "@office/shared/lib/form-state";
import { revalidateRoute } from "@office/shared/lib/revalidate";

const LISTS: OptionListKey[] = ["acquisition_source", "order_status"];

export interface AddOptionResult {
  option?: CustomOption;
  error?: string;
}

/** Add a value to one of the bureau's dropdowns; an existing one is returned as is. */
export async function addOptionAction(list: OptionListKey, value: string): Promise<AddOptionResult> {
  if (!LISTS.includes(list)) return { error: (await getTranslations("validation"))("missingId") };
  const trimmed = value.trim();
  if (!trimmed) return {};
  try {
    const option = await addOption(list, trimmed);
    // Every screen that reads the reference data should see it on its next load.
    revalidateRoute("/", "layout");
    return { option };
  } catch (error) {
    return { error: (await describeApiError(error, "option")).error };
  }
}

export interface DeleteOptionState {
  error?: string;
  ok?: boolean;
}

export async function deleteOptionAction(
  _previous: DeleteOptionState,
  formData: FormData,
): Promise<DeleteOptionState> {
  const list = String(formData.get("list") ?? "") as OptionListKey;
  const id = Number(formData.get("id"));
  if (!LISTS.includes(list) || !Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };
  try {
    await deleteOption(list, id);
  } catch (error) {
    return { error: (await describeApiError(error, "option")).error };
  }
  revalidateRoute("/", "layout");
  return { ok: true };
}
