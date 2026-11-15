"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import type {
  CopyType,
  HandoverMethod,
  QuoteLine,
  QuoteResponse,
  Urgency,
} from "@office/features/calculator/types";
import { api, ApiError } from "@office/shared/lib/api";

/**
 * Price a hypothetical order.
 *
 * Deliberately a server round trip rather than arithmetic in the browser. The
 * PHP app does this in JavaScript, which is how its pricing formula ended up
 * living in four places and drifting apart. One tested implementation in
 * `suliko.domain.pricing` prices the calculator, the order builder and the
 * invoice alike; the caller debounces to keep the trips reasonable.
 */

export interface QuoteInput {
  documents: {
    source_language: string;
    target_language: string;
    /** 0 or null on an oral line. */
    document_type_id: number | null;
    service_type?: "written" | "oral";
    page_count: number;
    /** Characters with spaces, when the bureau prices by characters. */
    character_count?: number | null;
    copy_type: CopyType;
    is_notarized?: boolean | null;
  }[];
  urgency: Urgency;
  handover_method: HandoverMethod;
}

export type QuoteResult =
  | {
      ok: true;
      quote: QuoteResponse;
      /**
       * One entry per INPUT row, null where the row is not complete enough
       * to price. The API only sees complete rows, so `quote.documents[i]` is
       * the i-th COMPLETE row — indexing it by the form's row number showed
       * row 2's price under row 1 whenever row 1 was unfinished.
       */
      rowLines: (QuoteLine | null)[];
    }
  | { ok: false; error: string };

export async function quoteAction(input: QuoteInput): Promise<QuoteResult> {
  const complete = input.documents.map(
    (d) =>
      Boolean(
        d.source_language &&
        d.target_language &&
        (d.service_type === "oral" || (d.document_type_id ?? 0) > 0),
      ),
  );
  const usable = input.documents.filter((_, i) => complete[i]);
  // Nothing to price yet — not an error, just an incomplete form.
  if (usable.length === 0) return { ok: false, error: "" };

  try {
    const quote = await api<QuoteResponse>("/api/v1/calculator/quote", {
      method: "POST",
      body: {
        ...input,
        documents: usable.map((d) =>
          d.service_type === "oral" ? { ...d, document_type_id: null } : d,
        ),
      },
    });
    let next = 0;
    const rowLines = complete.map((isComplete) =>
      isComplete ? (quote.documents[next++] ?? null) : null,
    );
    return { ok: true, quote, rowLines };
  } catch (error) {
    const t = await getTranslations("errors");
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, error: t("unreachable") };
      if (error.status >= 500) return { ok: false, error: t("server") };
      return { ok: false, error: error.detail };
    }
    return { ok: false, error: t("unreachable") };
  }
}
