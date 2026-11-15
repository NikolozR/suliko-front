"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import {
  removeInvoiceTemplate,
  uploadInvoiceTemplate,
  type InvoiceTemplate,
} from "@office/features/settings/invoice-template";
import { describeApiError } from "@office/shared/lib/form-state";
import { revalidateRoute } from "@office/shared/lib/revalidate";

export interface TemplateFormState {
  error?: string;
  ok?: boolean;
  template?: InvoiceTemplate;
}

/** Keep the chosen Word file as the bureau's invoice. */
export async function uploadInvoiceTemplateAction(
  _previous: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: (await getTranslations("settings.invoiceTemplate"))("chooseFile") };
  }
  try {
    const template = await uploadInvoiceTemplate(file);
    revalidateRoute("/settings", "page");
    return { ok: true, template };
  } catch (error) {
    return await describeApiError(error, "file");
  }
}

/** Go back to Suliko Office's own invoice layout. */
export async function removeInvoiceTemplateAction(): Promise<TemplateFormState> {
  try {
    const template = await removeInvoiceTemplate();
    revalidateRoute("/settings", "page");
    return { ok: true, template };
  } catch (error) {
    return await describeApiError(error, "file");
  }
}
