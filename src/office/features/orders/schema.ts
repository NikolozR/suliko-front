// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";

/**
 * Order form validation.
 *
 * Mirrors `OrderCreate` / `OrderUpdate` / `OrderDocumentUpdate` in
 * `api/v1/orders.py`. Messages are catalogue keys under `validation`.
 *
 * Money stays a string end to end (see `features/finances/schema.ts`), and a
 * comma is accepted as the decimal separator because that is what people type.
 */

export const URGENCIES = ["standard", "express", "urgent"] as const;
export const HANDOVER_METHODS = ["scan", "pickup", "delivery"] as const;
export const SERVICE_TYPES = ["written", "oral"] as const;
export const COPY_TYPES = [
  "original",
  "plain",
  "notary_original",
  "notary_copy",
  "notary_certified",
] as const;

const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), "date")
  .nullable();

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `maxChars:${max}`)
    .transform((value) => value || null)
    .nullable();
}

/**
 * An optional money override: blank means "use the calculated figure".
 * "120,50" and "120.50" both become "120.50".
 */
export const optionalMoney = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/g, "").replace(",", ".") || null)
  .refine((value) => value === null || /^\d{1,8}(\.\d{1,2})?$/.test(value), "amount")
  .nullable();

// Each message names its field ("Choose the source language"), so it still
// makes sense read on its own, as a screen reader reads it.
/** A written line needs a document type; an oral one has none. */
function needsDocumentType(
  value: { service_type?: "written" | "oral"; document_type_id?: number | null },
  context: z.RefinementCtx,
) {
  if (value.service_type !== "oral" && !value.document_type_id) {
    context.addIssue({ code: "custom", path: ["document_type_id"], message: "pickDocumentType" });
  }
}

/**
 * Where an interpreting line takes place, and when: an address as text, a day
 * and a time of day, each optional. Left out (not null) when empty, so an API
 * that does not know the fields yet is never sent them.
 */
const interpretingFields = {
  interpreting_place: z.string().trim().max(500, "maxChars:500").nullable().optional(),
  interpreting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date").nullable().optional(),
  interpreting_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "time").nullable().optional(),
};

export const orderDocumentSchema = z
  .object({
  /** Null on an oral line. */
  document_type_id: z.number().int().positive("pickDocumentType").nullable(),
  service_type: z.enum(SERVICE_TYPES).default("written"),
  source_language: z.string().trim().min(2, "pickSourceLanguage").max(5),
  target_language: z.string().trim().min(2, "pickTargetLanguage").max(5),
  page_count: z.number().int().min(1, "pageCount").max(10000, "pageCount"),
  /** Characters with spaces, for a bureau that prices by characters. */
  character_count: z.number().int().min(1, "characterCount").max(100000000, "characterCount").nullable().optional(),
  copy_type: z.enum(COPY_TYPES),
  /** Null = follow the copy type. True notarises an original, false waives it. */
  is_notarized: z.boolean().nullable().optional(),
  // The sentinel translator id the PHP used for "unassigned" is gone; null is
  // the real value here and the API stores it as such.
  translator_id: z.number().int().positive().nullable(),
  notary_id: z.number().int().positive().nullable(),
  price_override: optionalMoney.optional(),
  translator_cost_override: optionalMoney.optional(),
  notary_cost_override: optionalMoney.optional(),
  ...interpretingFields,
  })
  .superRefine(needsDocumentType);

export type OrderDocumentValues = z.infer<typeof orderDocumentSchema>;

/**
 * One existing document's changes on the edit screen. Only what changed is
 * present, which is what tells the API to keep everything else — including a
 * price someone negotiated — as stored.
 */
export const orderDocumentChangeSchema = z.object({
  id: z.number().int().positive(),
  document_type_id: z.number().int().positive("pickDocumentType").nullable().optional(),
  service_type: z.enum(SERVICE_TYPES).optional(),
  source_language: z.string().trim().min(2, "pickSourceLanguage").max(5).optional(),
  target_language: z.string().trim().min(2, "pickTargetLanguage").max(5).optional(),
  page_count: z.number().int().min(1, "pageCount").max(10000, "pageCount").optional(),
  character_count: z.number().int().min(1, "characterCount").max(100000000, "characterCount").nullable().optional(),
  copy_type: z.enum(COPY_TYPES).optional(),
  is_notarized: z.boolean().optional(),
  translator_id: z.number().int().positive().nullable().optional(),
  notary_id: z.number().int().positive().nullable().optional(),
  price: optionalMoney.optional(),
  translator_cost: optionalMoney.optional(),
  notary_cost: optionalMoney.optional(),
  ...interpretingFields,
});

/** Everything the edit screen changed about an order's documents. */
export const orderSaveSchema = z.object({
  add: z.array(orderDocumentSchema).max(50, "maxChars:50"),
  update: z.array(orderDocumentChangeSchema).max(50, "maxChars:50"),
  remove: z.array(z.number().int().positive()).max(50, "maxChars:50"),
});

export const orderCreateSchema = z
  .object({
    client_id: z.number().int().positive("pickClient"),
    documents: z.array(orderDocumentSchema).min(1, "required").max(50, "maxChars:50"),
    order_date: optionalDate,
    due_date: optionalDate,
    contact_info: optionalText(255),
    identifier: optionalText(100),
    urgency: z.enum(URGENCIES),
    handover_method: z.enum(HANDOVER_METHODS),
    delivery_address: optionalText(500),
    notes: optionalText(5000),
    translation_instructions: optionalText(5000),
  })
  .refine(
    // Courier delivery with nowhere to deliver to is an order that cannot be
    // fulfilled, and the mistake is invisible until someone tries to ship it.
    (order) => order.handover_method !== "delivery" || Boolean(order.delivery_address),
    { message: "required", path: ["delivery_address"] },
  )
  .refine(
    (order) => !order.due_date || !order.order_date || order.due_date >= order.order_date,
    { message: "date", path: ["due_date"] },
  );

export type OrderCreateValues = z.infer<typeof orderCreateSchema>;

export const orderUpdateSchema = z
  .object({
    /** Moving the order to another client; the API refuses it once paid. */
    client_id: z.number().int().positive("pickClient"),
    order_date: optionalDate,
    due_date: optionalDate,
    contact_info: optionalText(255),
    identifier: optionalText(100),
    urgency: z.enum(URGENCIES),
    handover_method: z.enum(HANDOVER_METHODS),
    delivery_address: optionalText(500),
    /** Blank = let the API set it from the handover (the tenant's fee or 0). */
    delivery_cost: optionalMoney,
    notes: optionalText(5000),
    translation_instructions: optionalText(5000),
  })
  .refine(
    (order) => order.handover_method !== "delivery" || Boolean(order.delivery_address),
    { message: "required", path: ["delivery_address"] },
  );

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

/** One document, edited on the order page. Only what changed is sent. */
export const documentUpdateSchema = z
  .object({
  document_type_id: z.number().int().positive("pickDocumentType").nullable(),
  service_type: z.enum(SERVICE_TYPES).default("written"),
  source_language: z.string().trim().min(2, "pickSourceLanguage").max(5),
  target_language: z.string().trim().min(2, "pickTargetLanguage").max(5),
  page_count: z.number().int().min(1, "pageCount").max(10000, "pageCount"),
  character_count: z.number().int().min(1, "characterCount").max(100000000, "characterCount").nullable(),
  copy_type: z.enum(COPY_TYPES),
  is_notarized: z.boolean(),
  translator_id: z.number().int().positive().nullable(),
  notary_id: z.number().int().positive().nullable(),
  price: optionalMoney,
  translator_cost: optionalMoney,
  notary_cost: optionalMoney,
  ...interpretingFields,
  })
  .superRefine(needsDocumentType);

export type DocumentUpdateValues = z.infer<typeof documentUpdateSchema>;

/**
 * Header fields by name; a document's by its path in what was sent:
 * "documents.0.source_language" on create, "add.0.…" / "update.0.…" on edit.
 */
export type OrderFieldErrors = Partial<
  Record<keyof OrderCreateValues | "documents" | "delivery_cost", string[]>
> &
  Record<string, string[] | undefined>;
