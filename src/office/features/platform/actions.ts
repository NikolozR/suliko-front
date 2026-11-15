"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { revalidateRoute } from "@office/shared/lib/revalidate";

import type { InvoiceStatus } from "@office/features/billing/api";
import {
  approveDeletionRequest,
  editBillingPackage,
  grantSuperusers,
  prepareInvoices,
  rejectDeletionRequest,
  revokeSuperuser,
  setClaudeTranslate,
  setFreeMonth,
  setInvoiceStatus,
  setTenantPackage,
  setTenantStatus,
  type PrepareResult,
  type SuperuserGrantResult,
  type TenantStatus,
} from "@office/features/platform/api";
import { ApiError } from "@office/shared/lib/api";
import { describeApiError } from "@office/shared/lib/form-state";

/**
 * Platform mutations.
 *
 * Every one of these acts on somebody else's organisation, so the API audits
 * them with the tenant recorded. The messages it returns are already written
 * to be read — a refusal here is usually a deliberate guard ("this is their
 * last owner", "you cannot suspend your own tenant") rather than a fault.
 */

export interface PlatformFormState {
  error?: string;
  ok?: boolean;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

export async function setTenantStatusAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const tenantId = Number(formData.get("tenant_id"));
  const status = String(formData.get("status") ?? "") as TenantStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isFinite(tenantId)) return { error: (await getTranslations("validation"))("missingId") };
  if (status === "suspended" && !reason) {
    return { error: (await getTranslations("platform"))("control.reasonRequired") };
  }

  try {
    await setTenantStatus(tenantId, status, reason || undefined);
  } catch (error) {
    return await describeApiError(error, "organisation");
  }

  revalidateRoute("/admin", "page");
  revalidateRoute(`/admin/tenants/${tenantId}`, "page");
  return { ok: true };
}

/** Give an organisation Claude Translate, or take it away. */
export async function setClaudeTranslateAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const tenantId = Number(formData.get("tenant_id"));
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";
  if (!Number.isFinite(tenantId)) return { error: (await getTranslations("validation"))("missingId") };

  try {
    await setClaudeTranslate(tenantId, enabled);
  } catch (error) {
    return await describeApiError(error, "organisation");
  }

  revalidateRoute(`/admin/tenants/${tenantId}`, "page");
  return { ok: true };
}

/** The most the API takes in one request. */
const MAX_SUPERUSERS_PER_REQUEST = 50;

export interface SuperuserFormState extends PlatformFormState {
  /** One answer per line, in the order they were sent. */
  results?: SuperuserGrantResult[];
  /** What was typed, so a refused submit does not empty the box. */
  identifiers?: string;
}

/**
 * Let a list of suliko.ge accounts into the platform area.
 *
 * One sign-in per line; commas and semicolons separate too, because a list
 * gets pasted from wherever it was kept. The API answers each line on its
 * own, so the form shows who got in and who did not instead of one verdict.
 */
export async function grantSuperusersAction(
  _previous: SuperuserFormState,
  formData: FormData,
): Promise<SuperuserFormState> {
  const typed = String(formData.get("identifiers") ?? "");
  const identifiers = [
    ...new Set(
      typed
        .split(/[\n,;]+/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
  const t = await getTranslations("platform.superusers");

  if (identifiers.length === 0) return { error: t("empty"), identifiers: typed };
  if (identifiers.length > MAX_SUPERUSERS_PER_REQUEST) {
    return { error: t("tooMany", { max: MAX_SUPERUSERS_PER_REQUEST }), identifiers: typed };
  }

  let results: SuperuserGrantResult[];
  try {
    ({ results } = await grantSuperusers(identifiers));
  } catch (error) {
    // suliko.ge could not be asked: the API's own sentence says so, and that
    // nothing was changed, which "something went wrong" would not.
    if (error instanceof ApiError && error.status === 503) {
      return { error: error.detail, identifiers: typed };
    }
    return { ...(await describeApiError(error, "account")), identifiers: typed };
  }

  revalidateRoute("/admin", "page");
  return { ok: true, results };
}

export async function revokeSuperuserAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  try {
    await revokeSuperuser(id);
  } catch (error) {
    return await describeApiError(error, "account");
  }

  revalidateRoute("/admin", "page");
  return { ok: true };
}

/**
 * Confirm a request to delete an account. The API refuses an organisation that
 * would be left without an owner, and wants `acknowledged` for anything else it
 * found; its sentence says which, so it is passed through.
 */
export async function approveDeletionAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };
  const note = String(formData.get("note") ?? "").trim();

  try {
    await approveDeletionRequest(id, {
      note: note || undefined,
      acknowledged: formData.get("acknowledged") === "on",
    });
  } catch (error) {
    return await describeApiError(error, "request");
  }

  revalidateRoute("/admin", "page");
  return { ok: true };
}

/** End a request without deleting anything: the account opens again. */
export async function rejectDeletionAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };
  const note = String(formData.get("note") ?? "").trim();

  try {
    await rejectDeletionRequest(id, { note: note || undefined });
  } catch (error) {
    return await describeApiError(error, "request");
  }

  revalidateRoute("/admin", "page");
  return { ok: true };
}

// ── Order packages and invoices ─────────────────────────────────────────────

/** A lari amount typed as "50", "50.5" or "50,50"; null when it is not one. */
function amountOf(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim().replace(",", ".");
  return /^\d{1,7}(\.\d{1,2})?$/.test(text) ? text : null;
}

/** Change what a package covers and costs, for every account on it. */
export async function editPackageAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const t = await getTranslations("platform.billing");
  const audience = String(formData.get("audience") ?? "");
  const tier = Number(formData.get("tier"));
  const included = Number(String(formData.get("orders_included") ?? "").trim());
  const priceText = String(formData.get("monthly_price") ?? "").trim();
  const monthly = priceText === "" ? null : amountOf(priceText);

  if (!["bureau", "freelancer"].includes(audience) || ![1, 2, 3].includes(tier)) {
    return { error: (await getTranslations("validation"))("missingId") };
  }
  if (!Number.isInteger(included) || included < 1 || included > 100_000) {
    return { error: t("errors.included") };
  }
  if (priceText !== "" && monthly === null) return { error: t("errors.price") };

  try {
    await editBillingPackage(audience, tier, { orders_included: included, monthly_price: monthly });
  } catch (error) {
    return await describeApiError(error, "package");
  }

  revalidateRoute("/admin/billing", "page");
  revalidateRoute("/billing", "page");
  return { ok: true };
}

/** Move an account to any package. An owner can only move UP, by themselves, on Billing. */
export async function setTenantPackageAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const tenantId = Number(formData.get("tenant_id"));
  const tier = Number(formData.get("tier"));
  if (!Number.isFinite(tenantId) || ![1, 2, 3].includes(tier)) {
    return { error: (await getTranslations("validation"))("missingId") };
  }

  try {
    await setTenantPackage(tenantId, tier);
  } catch (error) {
    return await describeApiError(error, "organisation");
  }

  revalidateRoute("/admin", "page");
  revalidateRoute("/admin/billing", "page");
  revalidateRoute(`/admin/tenants/${tenantId}`, "page");
  // The bureau's own page and the figure in its sidebar change with it.
  revalidateRoute("/billing", "page");
  return { ok: true };
}

/** Make a whole month free for an account, or take that back. Only the fee is waived. */
export async function setFreeMonthAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const tenantId = Number(formData.get("tenant_id"));
  const period = String(formData.get("period") ?? "");
  const free = formData.get("free") === "on" || formData.get("free") === "true";
  if (!Number.isFinite(tenantId) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return { error: (await getTranslations("validation"))("missingId") };
  }

  try {
    await setFreeMonth(tenantId, period, free);
  } catch (error) {
    return await describeApiError(error, "invoice");
  }

  revalidateRoute("/admin/billing", "page");
  revalidateRoute(`/admin/tenants/${tenantId}`, "page");
  // The bureau's own Billing page and the figure in its sidebar change with it.
  revalidateRoute("/billing", "page");
  return { ok: true };
}

export interface PrepareFormState extends PlatformFormState {
  result?: PrepareResult;
}

/** Work out every bureau's invoice for a month that has ended. Safe to repeat. */
export async function prepareInvoicesAction(
  _previous: PrepareFormState,
  formData: FormData,
): Promise<PrepareFormState> {
  const period = String(formData.get("period") ?? "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return { error: (await getTranslations("platform.billing"))("errors.period") };
  }

  let result: PrepareResult;
  try {
    result = await prepareInvoices(period);
  } catch (error) {
    return await describeApiError(error, "invoice");
  }

  revalidateRoute("/admin/billing", "page");
  return { ok: true, result };
}

const INVOICE_STATUSES: readonly InvoiceStatus[] = ["open", "sent", "paid", "waived"];

/** Follow an invoice by hand: open, sent, paid or waived, with a note. */
export async function setInvoiceStatusAction(
  _previous: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "") as InvoiceStatus;
  if (!Number.isFinite(id) || !INVOICE_STATUSES.includes(status)) {
    return { error: (await getTranslations("validation"))("missingId") };
  }
  const note = String(formData.get("note") ?? "").trim();

  try {
    await setInvoiceStatus(id, { status, note });
  } catch (error) {
    return await describeApiError(error, "invoice");
  }

  revalidateRoute("/admin/billing", "page");
  revalidateRoute("/billing", "page");
  return { ok: true };
}
