"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { createClient, listClients, type ClientType } from "@office/features/clients/api";
import { clientFormSchema } from "@office/features/clients/schema";
import { createNotary } from "@office/features/notaries/api";
import { notaryFormSchema } from "@office/features/notaries/schema";
import {
  addOrderDocument,
  changeOrderStatus,
  createOrder,
  deleteOrder,
  deleteOrderDocument,
  getOrder,
  saveOrder,
  updateOrderDocument,
} from "@office/features/orders/api";
import {
  documentUpdateSchema,
  orderCreateSchema,
  orderDocumentSchema,
  orderSaveSchema,
  orderUpdateSchema,
  type OrderFieldErrors,
  type OrderUpdateValues,
} from "@office/features/orders/schema";
import { assigneeWork, type Assignee } from "@office/features/orders/types";
import { upsertDocumentType, type DocumentType } from "@office/features/settings/api";
import { documentTypeSchema } from "@office/features/settings/schema";
import { createTranslator } from "@office/features/translators/api";
import { translatorFormSchema } from "@office/features/translators/schema";
import { workFlags } from "@office/features/translators/work-kind";
import { redirectTo } from "@office/i18n/navigation";
import { ApiError } from "@office/shared/lib/api";
import {
  changedFields,
  describeApiError,
  type QuickAddState,
  readStrings,
  validationFailed,
  validationFailedByPath,
} from "@office/shared/lib/form-state";
import { withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

/**
 * Order mutations.
 *
 * Status changes append to the history; they never update in place. The API
 * enforces that, and it also rejects any status outside the shared registry,
 * so a typo cannot create a value that renders as a grey "Unknown" pill
 * forever.
 */

export interface StatusFormState {
  error?: string;
  ok?: boolean;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

async function missingId(): Promise<{ error: string }> {
  return { error: (await getTranslations("validation"))("missingId") };
}

export async function changeStatusAction(
  _previous: StatusFormState,
  formData: FormData,
): Promise<StatusFormState> {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "").trim();

  if (!Number.isFinite(id)) return missingId();
  if (!status) return { error: (await getTranslations("validation"))("pickOne") };

  try {
    await changeOrderStatus(id, status);
  } catch (error) {
    return describeApiError(error, "order");
  }

  revalidateRoute(`/translations/${id}`);
  revalidateRoute("/translations");
  revalidateRoute("/dashboard");
  return { ok: true };
}

// ── Creating and editing ────────────────────────────────────────────────────

export interface OrderFormState {
  error?: string;
  fieldErrors?: OrderFieldErrors;
  /** Echoed back so a failed submit does not empty the form. */
  values?: Record<string, string>;
  ok?: boolean;
  /**
   * The order was stored. The form attaches any chosen files to its documents
   * and then navigates — which is why this returns instead of redirecting.
   * `documentIds` (create) follow the rows; `addedDocumentIds` (edit) follow
   * the rows that were new.
   */
  saved?: { orderId: number; documentIds?: number[]; addedDocumentIds?: number[] };
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

/**
 * Client search for the order builder's picker.
 *
 * A server action rather than a route handler: it is only ever called by one
 * component, and this way the session token stays server-side without a
 * bespoke endpoint to secure. The API matches name, email, phone (digit by
 * digit) and personal number.
 */
export async function searchClientsAction(
  term: string,
): Promise<{ id: number; number: number; name: string; client_type: "B2B" | "B2C" }[]> {
  const search = term.trim();
  if (search.length < 2) return [];

  try {
    const { items } = await listClients({ search, limit: 10, sort: "name" });
    return items.map((client) => ({
      id: client.id,
      number: client.number,
      name: client.name,
      client_type: client.client_type,
    }));
  } catch {
    // The picker degrades to "type an id" rather than breaking the form.
    return [];
  }
}

// ── Quick-add from the order builder ────────────────────────────────────────
//
// The Client, Document Type, Translator and Notary fields each get a "+" next
// to them so an order never has to be abandoned to go create the thing it
// needs. Every action below validates with the exact schema its own
// management screen uses, creates the record, and hands back just enough to
// select it immediately — never a redirect, because the order builder has to
// stay exactly where it was.

export async function quickCreateClientAction(
  _previous: QuickAddState<{ id: number; name: string; client_type: ClientType }>,
  formData: FormData,
): Promise<QuickAddState<{ id: number; name: string; client_type: ClientType }>> {
  const raw = {
    ...readStrings(formData, ["name", "phone", "email", "acquisition_source"]),
    client_type: String(formData.get("client_type") ?? "B2C"),
    address: "",
    personal_number: "",
    notes: "",
  };

  const parsed = clientFormSchema.safeParse(raw);
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  let created;
  try {
    created = await createClient(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "client")), values: raw };
  }

  // Like the other three: the Clients list must show the new row.
  revalidateRoute("/clients");
  return { item: { id: created.id, name: created.name, client_type: created.client_type } };
}

export async function quickCreateTranslatorAction(
  _previous: QuickAddState<Assignee>,
  formData: FormData,
): Promise<QuickAddState<Assignee>> {
  const raw = {
    ...readStrings(formData, ["name", "phone", "email", "default_rate", "work_kind", "city"]),
    office_address: "",
    experience_from: "",
    bank_iban: "",
    bank_inn: "",
    bank_code: "",
    comment: "",
  };

  // The pair editor's rows, as JSON in one hidden field. A row nobody
  // touched (the dialog opens with one when the document has no pair yet)
  // is not an error, only nothing.
  let pairs: unknown[] = [];
  try {
    const rows: unknown = JSON.parse(String(formData.get("language_pairs") ?? "[]"));
    if (Array.isArray(rows)) {
      pairs = rows.filter((row) => row && (row.source_language || row.target_language));
    }
  } catch {
    pairs = [];
  }
  const parsed = translatorFormSchema.safeParse({
    ...raw,
    is_active: true,
    can_notarize: formData.get("can_notarize") !== null,
    ...workFlags(raw.work_kind),
    language_pairs: pairs,
    cities: raw.city ? [raw.city] : [],
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  let created;
  try {
    created = await createTranslator(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "translator")), values: raw };
  }

  revalidateRoute("/translators");
  return {
    item: {
      id: created.id,
      name: created.name,
      default_rate: created.default_rate ?? null,
      ...assigneeWork(created),
    },
  };
}

export async function quickCreateNotaryAction(
  _previous: QuickAddState<Assignee>,
  formData: FormData,
): Promise<QuickAddState<Assignee>> {
  const raw = {
    ...readStrings(formData, ["name", "phone", "email"]),
    registration_number: "",
    office_address: "",
    bank_iban: "",
    bank_inn: "",
    bank_code: "",
    comment: "",
  };

  const parsed = notaryFormSchema.safeParse(raw);
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  let created;
  try {
    created = await createNotary(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "notary")), values: raw };
  }

  revalidateRoute("/notaries");
  return { item: { id: created.id, name: created.name } };
}

export async function quickCreateDocumentTypeAction(
  _previous: QuickAddState<DocumentType>,
  formData: FormData,
): Promise<QuickAddState<DocumentType>> {
  const raw = {
    ...readStrings(formData, ["name_en", "name_ka"]),
    price_multiplier: "1",
  };

  const parsed = documentTypeSchema.safeParse({ ...raw, is_active: true });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  let created;
  try {
    created = await upsertDocumentType(null, parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "documentType")), values: raw };
  }

  revalidateRoute("/settings");
  revalidateRoute("/calculator");
  return { item: created };
}

const HEADER_FIELDS = [
  "order_date",
  "due_date",
  "contact_info",
  "identifier",
  "urgency",
  "handover_method",
  "delivery_address",
  "notes",
  "translation_instructions",
] as const;

/** Documents travel as one JSON field — see the note in `schema.ts`. */
function parseDocuments(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createOrderAction(
  _previous: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const raw = {
    ...readStrings(formData, HEADER_FIELDS),
    client_id: String(formData.get("client_id") ?? ""),
    client_id_label: String(formData.get("client_id_label") ?? ""),
    client_id_type: String(formData.get("client_id_type") ?? ""),
    documents: String(formData.get("documents") ?? "[]"),
  };

  const parsed = orderCreateSchema.safeParse({
    ...raw,
    client_id: Number(raw.client_id),
    documents: parseDocuments(raw.documents),
  });

  if (!parsed.success) return { ...(await validationFailedByPath(parsed.error)), values: raw };

  let created;
  try {
    created = await createOrder(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "order")), values: raw };
  }

  revalidateRoute("/translations");
  revalidateRoute("/dashboard");
  return {
    ok: true,
    saved: {
      orderId: created.id,
      // Stored in the order they were sent, which is the rows' order.
      documentIds: [...created.documents].sort((a, b) => a.id - b.id).map((d) => d.id),
    },
  };
}

/**
 * The edit screen: header and documents, saved together by the API in one
 * transaction (`POST /orders/{id}/save`), so a refused document never leaves
 * the order half-changed.
 */
export async function saveOrderAction(
  _previous: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return missingId();

  const raw = readStrings(formData, [
    ...HEADER_FIELDS,
    "delivery_cost",
    "client_id",
    "client_id_label",
    "client_id_type",
  ]);
  const header = orderUpdateSchema.safeParse({ ...raw, client_id: Number(raw.client_id) });
  if (!header.success) return { ...(await validationFailed(header.error)), values: raw };

  let changesJson: unknown = {};
  try {
    changesJson = JSON.parse(String(formData.get("changes") ?? "{}"));
  } catch {
    changesJson = {};
  }
  const documents = orderSaveSchema.safeParse(changesJson);
  if (!documents.success) {
    return { ...(await validationFailedByPath(documents.error)), values: raw };
  }

  // Re-read for a precise diff, so a field nobody touched cannot overwrite an
  // edit someone else made in between.
  let current: Record<string, unknown> | null = null;
  try {
    current = (await getOrder(id)) as unknown as Record<string, unknown>;
  } catch {
    current = null;
  }
  const headerChanges = changedFields<OrderUpdateValues>(header.data, current, raw);
  if (headerChanges.delivery_cost === null) delete headerChanges.delivery_cost;
  if (
    headerChanges.delivery_cost &&
    current &&
    Number(headerChanges.delivery_cost) === Number(current.delivery_cost)
  ) {
    delete headerChanges.delivery_cost;
  }

  // A blank figure means "not changed" — the API refuses an explicit null.
  const update = documents.data.update
    .map((change) =>
      Object.fromEntries(
        Object.entries(change).filter(
          ([key, value]) =>
            !(value === null && ["price", "translator_cost", "notary_cost"].includes(key)),
        ),
      ) as (typeof documents.data.update)[number],
    )
    .filter((change) => Object.keys(change).length > 1);

  let result;
  try {
    result = await saveOrder(id, {
      header: Object.keys(headerChanges).length ? headerChanges : undefined,
      add: documents.data.add,
      update,
      remove: documents.data.remove,
    });
  } catch (error) {
    return { ...(await describeApiError(error, "order")), values: raw };
  }

  revalidateRoute("/translations");
  revalidateRoute(`/translations/${id}`);
  revalidateRoute("/dashboard");
  return { ok: true, saved: { orderId: id, addedDocumentIds: result.added_document_ids } };
}

// ── Documents on an existing order ──────────────────────────────────────────

const DOCUMENT_FIELDS = [
  "character_count",
  "service_type",
  "document_type_id",
  "source_language",
  "target_language",
  "page_count",
  "copy_type",
  "translator_id",
  "notary_id",
  "price",
  "translator_cost",
  "notary_cost",
  "interpreting_place",
  "interpreting_date",
  "interpreting_time",
] as const;

/**
 * Where an interpreting line takes place, from the dialog's boxes: blank is
 * null, and a written line has none. The time is "HH:MM" (what the box gives).
 */
function interpretingOf(raw: Record<string, string>, oral: boolean) {
  const place = oral ? raw.interpreting_place.trim() : "";
  return {
    interpreting_place: place || null,
    interpreting_date: oral && raw.interpreting_date ? raw.interpreting_date : null,
    interpreting_time: oral && raw.interpreting_time ? raw.interpreting_time : null,
  };
}

/**
 * A new line carries the place only when it has one: an API that does not know
 * the fields yet refuses a request that names them, even as null.
 */
function withoutEmptyPlace<T extends Record<string, unknown>>(values: T): T {
  const copy: Record<string, unknown> = { ...values };
  for (const key of ["interpreting_place", "interpreting_date", "interpreting_time"]) {
    if (copy[key] === null) delete copy[key];
  }
  return copy as T;
}

/** "12 500" typed by a person, as a number. */
function characters(text: string): number {
  return Number(text.replace(/\s/g, ""));
}

/**
 * On an order calculated by characters a written line has to carry its count.
 * The API takes a line without one and prices it by its pages, so the dialog
 * says which way the order is calculated (`pricing_unit`) and this asks.
 */
async function missingCharacters(
  formData: FormData,
  oral: boolean,
  raw: Record<string, string>,
): Promise<OrderFormState | null> {
  if (formData.get("pricing_unit") !== "characters" || oral) return null;
  if (raw.character_count.trim()) return null;
  const t = await getTranslations("validation");
  return {
    error: t("checkFields"),
    fieldErrors: { character_count: [t("characterCount")] },
    values: raw,
  };
}

/** Add one document; priced by the API at the order's urgency, overrides kept as typed. */
export async function addDocumentAction(
  _previous: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const orderId = Number(formData.get("order_id"));
  if (!Number.isFinite(orderId)) return missingId();

  const raw = readStrings(formData, DOCUMENT_FIELDS);
  const oral = raw.service_type === "oral";
  const missing = await missingCharacters(formData, oral, raw);
  if (missing) return missing;
  const parsed = orderDocumentSchema.safeParse({
    service_type: oral ? "oral" : "written",
    // Interpreting has no document type, copy type or notary.
    document_type_id: oral ? null : Number(raw.document_type_id),
    source_language: raw.source_language,
    target_language: raw.target_language,
    page_count: Number(raw.page_count),
    character_count: !oral && raw.character_count ? characters(raw.character_count) : null,
    copy_type: oral ? "original" : raw.copy_type,
    is_notarized: formData.get("is_notarized") !== null,
    translator_id: raw.translator_id ? Number(raw.translator_id) : null,
    notary_id: !oral && raw.notary_id ? Number(raw.notary_id) : null,
    price_override: raw.price,
    translator_cost_override: raw.translator_cost,
    notary_cost_override: raw.notary_cost,
    ...interpretingOf(raw, oral),
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  try {
    await addOrderDocument(orderId, withoutEmptyPlace(parsed.data));
  } catch (error) {
    return { ...(await describeApiError(error, "document")), values: raw };
  }

  revalidateRoute(`/translations/${orderId}`);
  revalidateRoute("/translations");
  return { ok: true };
}

/**
 * Change one document.
 *
 * Sends only what changed, against the values the form was opened with: the
 * API re-prices when what is being translated changes, EXCEPT for a money
 * field sent in the same request — so echoing an untouched price back would
 * pin it and stop the re-price.
 */
export async function updateDocumentAction(
  _previous: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const orderId = Number(formData.get("order_id"));
  const documentId = Number(formData.get("document_id"));
  if (!Number.isFinite(orderId) || !Number.isFinite(documentId)) return missingId();

  const raw = readStrings(formData, DOCUMENT_FIELDS);
  const oral = raw.service_type === "oral";
  const missing = await missingCharacters(formData, oral, raw);
  if (missing) return missing;
  const parsed = documentUpdateSchema.safeParse({
    ...raw,
    service_type: oral ? "oral" : "written",
    document_type_id: oral ? null : Number(raw.document_type_id),
    // An oral line has no copy type or notarisation of its own.
    copy_type: oral ? "original" : raw.copy_type,
    page_count: Number(raw.page_count),
    character_count: !oral && raw.character_count ? characters(raw.character_count) : null,
    is_notarized: !oral && formData.get("is_notarized") !== null,
    translator_id: raw.translator_id ? Number(raw.translator_id) : null,
    notary_id: !oral && raw.notary_id ? Number(raw.notary_id) : null,
    ...interpretingOf(raw, oral),
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  let original: Record<string, unknown> = {};
  try {
    original = JSON.parse(String(formData.get("original") ?? "{}")) as Record<string, unknown>;
  } catch {
    original = {};
  }

  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    const before = original[key];
    const same =
      ["price", "translator_cost", "notary_cost"].includes(key)
        ? value === null || Number(value) === Number(before)
        : value === before;
    if (!same) changes[key] = value;
  }
  if (Object.keys(changes).length === 0) return { ok: true };

  try {
    await updateOrderDocument(orderId, documentId, changes);
  } catch (error) {
    return { ...(await describeApiError(error, "document")), values: raw };
  }

  revalidateRoute(`/translations/${orderId}`);
  revalidateRoute("/translations");
  return { ok: true };
}

/**
 * Remove one document, from the confirm button on the order page. A refusal
 * — the last document, or one with money allocated to it — comes back to the
 * order as `?error=`.
 */
export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const orderId = Number(formData.get("order_id"));
  const documentId = Number(formData.get("id"));
  if (!Number.isInteger(orderId) || orderId <= 0) redirectTo("/translations", locale);
  if (!Number.isInteger(documentId) || documentId <= 0) {
    redirectTo(`/translations/${orderId}`, locale);
  }

  try {
    await deleteOrderDocument(orderId, documentId);
  } catch (error) {
    const { error: message } = await describeApiError(error, "document");
    redirectTo(`/translations/${orderId}?error=${encodeURIComponent(message)}`, locale);
  }

  revalidateRoute(`/translations/${orderId}`);
  revalidateRoute("/translations");
  revalidateRoute("/dashboard");
  redirectTo(withFlash(`/translations/${orderId}`, "documentDeleted"), locale);
}

export async function deleteOrderAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await deleteOrder(id);
  } catch (error) {
    // An order with money against it must not vanish — the money would point
    // at nothing. The API names what is recorded and says to cancel instead.
    const reason =
      error instanceof ApiError && (error.status === 409 || error.status === 400)
        ? error.detail
        : (await describeApiError(error, "order")).error;
    redirectTo(`/translations/${id}?error=${encodeURIComponent(reason)}`, locale);
  }

  revalidateRoute("/translations");
  revalidateRoute("/dashboard");
  redirectTo(withFlash("/translations", "orderDeleted"), locale);
}
