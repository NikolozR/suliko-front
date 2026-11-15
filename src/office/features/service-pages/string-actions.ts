"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { revalidateRoute } from "@office/shared/lib/revalidate";

import { saveStrings } from "@office/features/service-pages/api";
import { describeApiError } from "@office/shared/lib/form-state";

/**
 * Site-string edits.
 *
 * One PUT for the whole batch rather than one PATCH per key: the editor is a
 * grid, and someone fixing twenty labels should produce one request and one
 * audit entry, not twenty of each. The API is built for exactly that shape.
 */

export interface StringsFormState {
  error?: string;
  /** How many rows were written, for the confirmation line. */
  saved?: number;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

interface EditedRow {
  key: string;
  locale: string;
  value: string;
}

function parseRows(raw: string): EditedRow[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is EditedRow =>
          typeof row?.key === "string" &&
          typeof row?.locale === "string" &&
          typeof row?.value === "string",
      )
      .slice(0, 500); // Matches the API's per-request cap.
  } catch {
    return [];
  }
}

export async function saveStringsAction(
  _previous: StringsFormState,
  formData: FormData,
): Promise<StringsFormState> {
  const rows = parseRows(String(formData.get("rows") ?? "[]"));

  // Nothing edited is not an error — the button is simply a no-op.
  if (rows.length === 0) return { saved: 0 };

  try {
    await saveStrings(rows);
  } catch (error) {
    return await describeApiError(error, "string");
  }

  revalidateRoute("/website-translations");
  return { saved: rows.length };
}
