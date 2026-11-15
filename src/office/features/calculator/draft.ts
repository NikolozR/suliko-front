// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Hand a calculator quote to the order builder.
 *
 * "Create order from this quote" should not make anyone re-enter the documents
 * they just priced. The quote travels through `sessionStorage` — one tab, gone
 * when the tab closes, and nothing about it in the URL — and the order form
 * reads it once, only when it was opened with `?from=quote`, then deletes it.
 */

import type { CopyType, HandoverMethod, Urgency } from "@office/features/calculator/types";

const KEY = "suliko.quote-draft";

export interface QuoteDraft {
  documents: {
    source_language: string;
    target_language: string;
    document_type_id: number;
    page_count: number;
    /** Characters with spaces, for a bureau that prices by characters. */
    character_count?: number | null;
    copy_type: CopyType;
    is_notarized?: boolean | null;
  }[];
  urgency: Urgency;
  handover_method: HandoverMethod;
  /** What the quote was calculated by; the order is calculated the same way. */
  pricing_unit?: "pages" | "characters";
}

export function saveQuoteDraft(draft: QuoteDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private mode or storage disabled: the order form simply starts empty.
  }
}

/** Read and forget — a draft is used once. */
export function takeQuoteDraft(): QuoteDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as QuoteDraft;
    return Array.isArray(draft?.documents) ? draft : null;
  } catch {
    return null;
  }
}
