/**
 * Order wizard state, validation and the client-side estimate — handoff §5.
 *
 * The estimate here is display-only. The authoritative total is whatever the
 * order endpoint returns; the confirmation panel shows that one, labelled
 * "confirmed total".
 */

import type { OrderReference } from '@/shared/utils/notaryOrderApi';
import {
  ACQUISITION_SOURCE,
  DEFAULT_HANDOVER,
  DEFAULT_URGENCY,
  MAX_PAGES,
  MIN_PAGES,
  ORDER_SOURCE_LABEL,
  ORDER_SOURCE_SITE,
} from '@/shared/utils/notaryOrderConfig';
import {
  copyTypesFor,
  handoverRequiresAddress,
  pairExists,
} from '@/shared/utils/notaryReferenceData';
import { estimateOrder, type Estimate } from '@/shared/utils/notaryEstimate';
import type { OrderPayload } from '@/shared/utils/notaryOrderApi';

/**
 * `serviceType` does not exist in the API. It is a UI split of the single
 * `copy_type` field: `regular` shows copy types where `notarized === false`,
 * `notary` shows the rest.
 */
export type ServiceType = 'regular' | 'notary';
export type ClientType = 'individual' | 'business';

export interface OrderDocument {
  id: number;
  fromLang: string;
  toLang: string;
  /** The reference's `type_id`; '' until chosen. */
  documentType: number | '';
  pages: number;
  serviceType: ServiceType;
  copyType: string;
  files: File[];
}

export interface OrderContact {
  clientType: ClientType;
  firstName: string;
  lastName: string;
  businessId: string;
  needsInvoice: boolean;
  email: string;
  phone: string;
  address: string;
  notes: string;
  terms: boolean;
}

export interface OrderState {
  documents: OrderDocument[];
  urgency: string;
  handover: string[];
  contact: OrderContact;
}

export function createDocument(id: number): OrderDocument {
  return {
    id,
    fromLang: '',
    toLang: '',
    documentType: '',
    pages: 1,
    serviceType: 'regular',
    copyType: '',
    files: [],
  };
}

export function createInitialState(): OrderState {
  return {
    documents: [createDocument(1)],
    urgency: DEFAULT_URGENCY,
    handover: [...DEFAULT_HANDOVER],
    contact: {
      clientType: 'individual',
      firstName: '',
      lastName: '',
      businessId: '',
      needsInvoice: false,
      email: '',
      phone: '',
      address: '',
      notes: '',
      terms: false,
    },
  };
}

/**
 * Switching service type resets `copyType` to the first valid one, so the field
 * can never hold a code the current tiles do not offer.
 */
export function firstCopyTypeFor(
  reference: OrderReference,
  serviceType: ServiceType
): string {
  return copyTypesFor(reference, serviceType)[0]?.value ?? '';
}

// ---------------------------------------------------------------------------
// Validation (§5.2, §5.4)
// ---------------------------------------------------------------------------

export interface StepErrors {
  [field: string]: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s()-]{5,}$/;

/** Step 1 — every document must resolve to a pair the catalogue publishes. */
export function validateConfigure(
  state: OrderState,
  reference: OrderReference,
  t: (key: string) => string
): StepErrors {
  const errors: StepErrors = {};

  state.documents.forEach((doc, index) => {
    const prefix = `documents.${index}`;
    if (!doc.fromLang) errors[`${prefix}.fromLang`] = t('errors.required');
    if (!doc.toLang) errors[`${prefix}.toLang`] = t('errors.required');
    if (doc.fromLang && doc.toLang && !pairExists(reference, doc.fromLang, doc.toLang)) {
      errors[`${prefix}.toLang`] = t('errors.pairUnavailable');
    }
    if (doc.documentType === '') errors[`${prefix}.documentType`] = t('errors.required');
    if (!Number.isInteger(doc.pages) || doc.pages < MIN_PAGES || doc.pages > MAX_PAGES) {
      errors[`${prefix}.pages`] = t('errors.pageRange');
    }
    if (!doc.copyType) errors[`${prefix}.copyType`] = t('errors.required');
  });

  if (state.handover.length === 0) errors.handover = t('errors.handoverRequired');

  return errors;
}

/** Step 4 — business swaps the surname field for a tax ID. */
export function validateDetails(
  state: OrderState,
  reference: OrderReference,
  t: (key: string) => string
): StepErrors {
  const errors: StepErrors = {};
  const { contact } = state;

  if (!contact.firstName.trim()) errors.firstName = t('errors.required');

  if (contact.clientType === 'business') {
    if (!contact.businessId.trim()) errors.businessId = t('errors.required');
  } else if (!contact.lastName.trim()) {
    errors.lastName = t('errors.required');
  }

  if (!contact.email.trim()) errors.email = t('errors.required');
  else if (!EMAIL_RE.test(contact.email.trim())) errors.email = t('errors.email');

  if (!contact.phone.trim()) errors.phone = t('errors.required');
  else if (!PHONE_RE.test(contact.phone.trim())) errors.phone = t('errors.phone');

  // Address is required only when a selected handover method needs one.
  if (handoverRequiresAddress(reference, state.handover) && !contact.address.trim()) {
    errors.address = t('errors.required');
  }

  if (!contact.terms) errors.terms = t('errors.terms');

  return errors;
}

// ---------------------------------------------------------------------------
// Estimate (§5.3) — delegated to the shared maths so the calculator and the
// wizard cannot drift apart.
// ---------------------------------------------------------------------------

export type { Estimate, EstimateLine } from '@/shared/utils/notaryEstimate';

export function calculateEstimate(
  state: OrderState,
  reference: OrderReference
): Estimate {
  return estimateOrder(
    reference,
    state.documents.map((doc) => ({
      fromLang: doc.fromLang,
      toLang: doc.toLang,
      documentType: doc.documentType,
      pages: doc.pages,
      copyType: doc.copyType,
    })),
    state.urgency,
    state.handover
  );
}

// ---------------------------------------------------------------------------
// Payload (§5.4)
// ---------------------------------------------------------------------------

/**
 * Compose the free-text notes field.
 *
 * The first line names the source. The partner account is shared with
 * notarytranslation.ge and `acquisition_source` is ignored on their side, so
 * without this line there is nothing distinguishing a Suliko order from theirs.
 *
 * The API has no client-type or company fields either, so the segment goes on
 * the same line, and the tax ID is restated here because `notes` is what
 * billing actually reads. Filenames are listed even though files upload
 * separately: it gives staff a checklist to spot an upload that never landed,
 * and is the only record of the names if uploading fails entirely.
 */
export function buildNotes(state: OrderState): string {
  const isBusiness = state.contact.clientType === 'business';
  const parts: string[] = [
    `[${ORDER_SOURCE_LABEL}] Order from ${ORDER_SOURCE_SITE} — ${
      isBusiness ? 'B2B (business)' : 'B2C (individual)'
    }`,
  ];

  if (isBusiness) {
    parts.push(
      `Company: ${state.contact.firstName.trim()} | Tax ID: ${state.contact.businessId.trim()}`
    );
    if (state.contact.needsInvoice) parts.push('Invoice requested.');
  }

  const notes = state.contact.notes.trim();
  if (notes) parts.push(notes);

  const fileNames = state.documents.flatMap((doc, docIndex) =>
    doc.files.map((file) => `#${docIndex + 1} ${file.name}`)
  );
  if (fileNames.length > 0) {
    parts.push(
      `Client is uploading ${fileNames.length} file(s): ${fileNames.join(', ')}`
    );
  }

  return parts.join('\n');
}

export function buildOrderPayload(
  state: OrderState,
  externalReference: string
): OrderPayload {
  const { contact } = state;

  return {
    external_reference: externalReference,
    acquisition_source: ACQUISITION_SOURCE,
    client: {
      first_name: contact.firstName.trim(),
      // The tax ID travels in the slot the UI swapped for it.
      last_name:
        contact.clientType === 'business'
          ? contact.businessId.trim()
          : contact.lastName.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      address: contact.address.trim(),
    },
    urgency: state.urgency,
    handover_methods: [...state.handover],
    documents: state.documents.map((doc) => ({
      language_pair: `${doc.fromLang}-${doc.toLang}`,
      document_type: Number(doc.documentType),
      page_count: doc.pages,
      copy_type: doc.copyType,
    })),
    notes: buildNotes(state),
  };
}

export function totalFileCount(state: OrderState): number {
  return state.documents.reduce((sum, doc) => sum + doc.files.length, 0);
}

export function totalPageCount(state: OrderState): number {
  return state.documents.reduce((sum, doc) => sum + doc.pages, 0);
}
