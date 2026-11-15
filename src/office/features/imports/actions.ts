"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import {
  analyseCombined,
  analyseImport,
  commitCombined,
  commitImport,
  previewCombined,
  previewImport,
  undoImport,
  type BatchKind,
  type CombinedAnalysis,
  type CombinedPreview,
  type ImportAnalysis,
  type ImportBatch,
  type ImportKind,
  type ImportPreview,
} from "@office/features/imports/api";
import { ApiError } from "@office/shared/lib/api";
import { revalidateRoute } from "@office/shared/lib/revalidate";

/**
 * The import wizard's steps. Each returns a result instead of throwing: a
 * thrown error in a server action reaches the browser as an opaque digest, and
 * "the file has no rows" is exactly what the person needs to read.
 */

type Failed = { ok: false; error: string };

async function explain(error: unknown): Promise<Failed> {
  const t = await getTranslations("import.errors");
  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: t("noAccess") };
    if (error.status === 413) return { ok: false, error: t("tooLarge") };
    // The API's wording is written for a person.
    return { ok: false, error: error.detail };
  }
  return { ok: false, error: t("unreachable") };
}

function kindOf(value: FormDataEntryValue | null): ImportKind | null {
  return value === "clients" ||
    value === "translators" ||
    value === "notaries" ||
    value === "orders"
    ? value
    : null;
}

function mappingOf(value: FormDataEntryValue | null): Record<string, number> | null {
  try {
    const parsed: unknown = JSON.parse(String(value ?? ""));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, number> = {};
    for (const [key, index] of Object.entries(parsed)) {
      if (typeof index === "number" && Number.isInteger(index)) out[key] = index;
    }
    return out;
  } catch {
    return null;
  }
}

async function input(formData: FormData): Promise<
  | { ok: true; kind: ImportKind; file: File; mapping: Record<string, number> | null }
  | Failed
> {
  const t = await getTranslations("import.errors");
  const kind = kindOf(formData.get("kind"));
  const file = formData.get("file");
  if (!kind) return { ok: false, error: t("chooseKind") };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t("chooseFile") };
  return { ok: true, kind, file, mapping: mappingOf(formData.get("mapping")) };
}

export async function analyseImportAction(
  formData: FormData,
): Promise<{ ok: true; analysis: ImportAnalysis } | Failed> {
  const got = await input(formData);
  if (!got.ok) return got;
  try {
    return { ok: true, analysis: await analyseImport(got.kind, got.file) };
  } catch (error) {
    return explain(error);
  }
}

export async function previewImportAction(
  formData: FormData,
): Promise<{ ok: true; preview: ImportPreview } | Failed> {
  const got = await input(formData);
  if (!got.ok) return got;
  if (!got.mapping) return { ok: false, error: (await getTranslations("import.errors"))("noMapping") };
  try {
    return { ok: true, preview: await previewImport(got.kind, got.file, got.mapping) };
  } catch (error) {
    return explain(error);
  }
}

export async function commitImportAction(
  formData: FormData,
): Promise<{ ok: true; batch: ImportBatch } | Failed> {
  const got = await input(formData);
  if (!got.ok) return got;
  if (!got.mapping) return { ok: false, error: (await getTranslations("import.errors"))("noMapping") };
  try {
    const batch = await commitImport(got.kind, got.file, got.mapping);
    refresh(got.kind);
    return { ok: true, batch };
  } catch (error) {
    return explain(error);
  }
}

/** The file and the person's choices for each sheet, for the one-file import. */
async function combinedInput(
  formData: FormData,
  withChoices: boolean,
): Promise<{ ok: true; file: File; choices: string } | Failed> {
  const t = await getTranslations("import.errors");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t("chooseFile") };
  if (!withChoices) return { ok: true, file, choices: "[]" };
  const choices = String(formData.get("choices") ?? "");
  try {
    const parsed: unknown = JSON.parse(choices);
    if (!Array.isArray(parsed) || choices.length > 200_000) throw new Error("shape");
  } catch {
    return { ok: false, error: t("noMapping") };
  }
  return { ok: true, file, choices };
}

export async function analyseCombinedAction(
  formData: FormData,
): Promise<{ ok: true; analysis: CombinedAnalysis } | Failed> {
  const got = await combinedInput(formData, false);
  if (!got.ok) return got;
  try {
    return { ok: true, analysis: await analyseCombined(got.file) };
  } catch (error) {
    return explain(error);
  }
}

export async function previewCombinedAction(
  formData: FormData,
): Promise<{ ok: true; preview: CombinedPreview } | Failed> {
  const got = await combinedInput(formData, true);
  if (!got.ok) return got;
  try {
    return { ok: true, preview: await previewCombined(got.file, got.choices) };
  } catch (error) {
    return explain(error);
  }
}

export async function commitCombinedAction(
  formData: FormData,
): Promise<{ ok: true; batch: ImportBatch } | Failed> {
  const got = await combinedInput(formData, true);
  if (!got.ok) return got;
  try {
    const batch = await commitCombined(got.file, got.choices);
    refresh("combined");
    return { ok: true, batch };
  } catch (error) {
    return explain(error);
  }
}

export async function undoImportAction(id: number): Promise<{ ok: true; batch: ImportBatch } | Failed> {
  if (!Number.isInteger(id)) return { ok: false, error: (await getTranslations("import.errors"))("noAccess") };
  try {
    const batch = await undoImport(id);
    refresh(batch.kind);
    return { ok: true, batch };
  } catch (error) {
    return explain(error);
  }
}

/** What an import changes: the list it fills, and the history on the settings screen. */
function refresh(kind: BatchKind) {
  const everything = kind === "combined";
  if (everything || kind === "clients" || kind === "orders") revalidateRoute("/clients");
  if (everything || kind === "translators") revalidateRoute("/translators");
  if (everything || kind === "notaries") revalidateRoute("/notaries");
  if (everything || kind === "orders") revalidateRoute("/translations");
  revalidateRoute("/settings");
}
