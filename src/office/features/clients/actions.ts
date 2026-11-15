"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

import { redirectTo } from "@office/i18n/navigation";
import { getTranslations } from "next-intl/server";

import {
  createClient,
  deleteClient,
  findDuplicates,
  getClient,
  updateClient,
  type PossibleDuplicate,
} from "@office/features/clients/api";
import {
  clientFormSchema,
  type ClientFieldErrors,
  type ClientFormValues,
} from "@office/features/clients/schema";
import { ApiError } from "@office/shared/lib/api";
import { describeApiError, validationFailed } from "@office/shared/lib/form-state";

/**
 * Client mutations.
 *
 * Every one re-validates with the same Zod schema the browser used. The
 * client-side check is a convenience; this is the copy that runs on input the
 * user controls, and the API validates again behind it.
 */

export interface ClientFormState {
  error?: string;
  fieldErrors?: ClientFieldErrors;
  /** Echoed back so the form can repopulate after a failed submit. */
  values?: Record<string, string>;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

/** FormData is all strings; Zod's transforms turn blanks into nulls. */
function readForm(formData: FormData): Record<string, string> {
  return {
    name: String(formData.get("name") ?? ""),
    client_type: String(formData.get("client_type") ?? "B2C"),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    personal_number: String(formData.get("personal_number") ?? ""),
    acquisition_source: String(formData.get("acquisition_source") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

/**
 * Clients who may be this one, for the form's warning. Best effort: a failed
 * lookup is no warning, never a blocked form.
 */
export async function duplicatesAction(input: {
  phone?: string;
  email?: string;
  personalNumber?: string;
  excludeId?: number;
}): Promise<PossibleDuplicate[]> {
  try {
    return await findDuplicates({
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      personalNumber: input.personalNumber?.trim() || undefined,
      excludeId: input.excludeId,
    });
  } catch {
    return [];
  }
}

export async function createClientAction(
  _previous: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const raw = readForm(formData);

  const parsed = clientFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  let created;
  try {
    created = await createClient(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "client")), values: raw };
  }

  // The list is cached per-path; without this the new client is missing from
  // it until the cache expires.
  revalidateRoute("/clients");
  redirectTo(withFlash(`/clients/${created.id}`, "clientCreated"), locale);
}

export async function updateClientAction(
  _previous: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  const raw = readForm(formData);

  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  const parsed = clientFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  // Send only what changed. Re-reading the record costs one request but means
  // an untouched field cannot clobber an edit someone else made in between.
  const changes: Partial<ClientFormValues> = {};

  let currentByKey: Record<string, unknown> | null = null;
  try {
    // `as unknown as` because ClientDetail has no index signature — the double
    // assertion is the narrowest way to say "read this by key" without
    // loosening the type everywhere else.
    currentByKey = (await getClient(id)) as unknown as Record<string, unknown>;
  } catch {
    // If the re-read fails, fall through: every field is sent rather than
    // refusing to save at all.
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    // `personal_number` is WRITE-ONLY. The API returns it only as
    // `personal_number_masked`, so there is nothing to compare against and the
    // naive diff below would always see a difference.
    //
    // A blank field therefore means "leave it alone", NOT "clear it".
    // Without this, editing a phone number silently wipes the client's
    // national ID — the form cannot prefill the real value, so it is always
    // blank unless the user deliberately types a new one.
    if (key === "personal_number") {
      if (raw.personal_number.trim()) {
        changes.personal_number = value as string | null;
      }
      continue;
    }

    if (currentByKey === null || value !== currentByKey[key]) {
      (changes as Record<string, unknown>)[key] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    redirectTo(withFlash(`/clients/${id}`, "clientSaved"), locale);
  }

  try {
    await updateClient(id, changes);
  } catch (error) {
    return { ...(await describeApiError(error, "client")), values: raw };
  }

  revalidateRoute("/clients");
  revalidateRoute(`/clients/${id}`);
  redirectTo(withFlash(`/clients/${id}`, "clientSaved"), locale);
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await deleteClient(id);
  } catch (error) {
    // `orders.client_id` is ON DELETE RESTRICT, so a client with history
    // cannot be removed — the database refuses rather than orphaning orders.
    // That is correct behaviour, but it surfaces as a 500 today because the
    // API maps every SQLAlchemy error to a flat internal error. Redirect back
    // with a readable explanation instead of dumping the user on an error page.
    const reason =
      error instanceof ApiError && error.status === 409
        ? error.detail
        : (await getTranslations("clients.detail"))("deleteRefused");
    redirectTo(`/clients/${id}?error=${encodeURIComponent(reason)}`, locale);
  }

  revalidateRoute("/clients");
  redirectTo(withFlash("/clients", "clientDeleted"), locale);
}
