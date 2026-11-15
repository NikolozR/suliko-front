"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { revalidateRoute } from "@office/shared/lib/revalidate";

import {
  addBankAccount,
  deleteBankAccount,
  makeBankAccountPrimary,
  saveCompany,
} from "@office/features/settings/companies";
import type { CompanyRole } from "@office/features/settings/company-types";
import { describeApiError, readStrings } from "@office/shared/lib/form-state";

/**
 * Company mutations.
 *
 * These feed a document that goes to a client and, in Georgia, to their
 * accountant. The API is the authority on what an invoice cannot go out
 * without; these actions carry its refusals through verbatim rather than
 * paraphrasing them, because "missing the tax number" is actionable and
 * "invalid company" is not.
 */

export interface CompanyFormState {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

const COMPANY_FIELDS = [
  "name_ka",
  "name_en",
  "director_ka",
  "director_en",
  "site",
  "address_ka",
  "address_en",
  "id_number",
  "email",
  "phone",
  "whatsapp",
] as const;

function revalidateInvoiceConsumers() {
  revalidateRoute("/settings");
  // Every order screen offers an invoice, and its availability depends on
  // whether the company is complete.
  revalidateRoute("/translations", "layout");
}

export async function saveCompanyAction(
  _previous: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const role = String(formData.get("role") ?? "") as CompanyRole;
  if (role !== "legal_entity" && role !== "brand") {
    return { error: (await getTranslations("validation"))("missingId") };
  }

  const raw = readStrings(formData, COMPANY_FIELDS);

  try {
    await saveCompany(role, raw);
  } catch (error) {
    return { ...(await describeApiError(error, "company")), values: raw };
  }

  revalidateInvoiceConsumers();
  return { ok: true, values: raw };
}

export async function addBankAccountAction(
  _previous: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const role = String(formData.get("role") ?? "") as CompanyRole;
  if (role !== "legal_entity" && role !== "brand") {
    return { error: (await getTranslations("validation"))("missingId") };
  }

  const raw = readStrings(formData, [
    "bank_name",
    "bank_iban",
    "bank_swift",
    "account_name",
  ]);

  if (!raw.bank_iban.trim()) {
    // Caught here rather than by the API: an account with no IBAN passes
    // validation and then silently fails the invoice readiness check, which
    // is a confusing way to learn you typed nothing.
    return { error: (await getTranslations("settings"))("companies.ibanRequired"), values: raw };
  }

  try {
    await addBankAccount(role, {
      ...raw,
      bank_iban: raw.bank_iban.replace(/\s+/g, "").toUpperCase(),
      is_primary: formData.get("is_primary") !== null,
    });
  } catch (error) {
    return { ...(await describeApiError(error, "bankAccount")), values: raw };
  }

  revalidateInvoiceConsumers();
  return { ok: true };
}

export async function makePrimaryAction(
  _previous: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  try {
    await makeBankAccountPrimary(id);
  } catch (error) {
    return await describeApiError(error, "bankAccount");
  }

  revalidateInvoiceConsumers();
  return { ok: true };
}

export async function deleteBankAccountAction(
  _previous: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  try {
    await deleteBankAccount(id);
  } catch (error) {
    return await describeApiError(error, "bankAccount");
  }

  revalidateInvoiceConsumers();
  return { ok: true };
}
