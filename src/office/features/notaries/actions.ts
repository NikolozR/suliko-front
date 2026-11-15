"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

import { redirectTo } from "@office/i18n/navigation";
import {
  createNotary,
  deleteNotary,
  getNotary,
  updateNotary,
} from "@office/features/notaries/api";
import {
  NOTARY_WRITE_ONLY,
  notaryFormSchema,
  type NotaryFieldErrors,
  type NotaryFormValues,
} from "@office/features/notaries/schema";
import { changedFields, describeApiError, readStrings, validationFailed } from "@office/shared/lib/form-state";

export interface NotaryFormState {
  error?: string;
  fieldErrors?: NotaryFieldErrors;
  values?: Record<string, string>;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

const FIELDS = [
  "name",
  "phone",
  "email",
  "registration_number",
  "office_address",
  "bank_iban",
  "bank_inn",
  "bank_code",
  "comment",
] as const;

export async function createNotaryAction(
  _previous: NotaryFormState,
  formData: FormData,
): Promise<NotaryFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const raw = readStrings(formData, FIELDS);

  const parsed = notaryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  let created;
  try {
    created = await createNotary(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "notary")), values: raw };
  }

  revalidateRoute("/notaries");
  redirectTo(withFlash(`/notaries/${created.id}`, "notaryCreated"), locale);
}

export async function updateNotaryAction(
  _previous: NotaryFormState,
  formData: FormData,
): Promise<NotaryFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  const raw = readStrings(formData, FIELDS);

  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  const parsed = notaryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  let current: Record<string, unknown> | null = null;
  try {
    current = (await getNotary(id)) as unknown as Record<string, unknown>;
  } catch {
    current = null;
  }

  const changes = changedFields<NotaryFormValues>(parsed.data, current, raw, NOTARY_WRITE_ONLY);

  if (Object.keys(changes).length === 0) {
    redirectTo(withFlash(`/notaries/${id}`, "notarySaved"), locale);
  }

  try {
    await updateNotary(id, changes);
  } catch (error) {
    return { ...(await describeApiError(error, "notary")), values: raw };
  }

  revalidateRoute("/notaries");
  revalidateRoute(`/notaries/${id}`);
  redirectTo(withFlash(`/notaries/${id}`, "notarySaved"), locale);
}

export async function deleteNotaryAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await deleteNotary(id);
  } catch (error) {
    // Unlike clients and translators, this one usually succeeds:
    // `order_documents.notary_id` is ON DELETE SET NULL, so the fee stays on
    // the document and becomes unattributed rather than blocking the delete.
    const reason = (await describeApiError(error, "notary")).error;
    redirectTo(`/notaries/${id}?error=${encodeURIComponent(reason)}`, locale);
  }

  revalidateRoute("/notaries");
  redirectTo(withFlash("/notaries", "notaryDeleted"), locale);
}
