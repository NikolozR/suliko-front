// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations } from "next-intl/server";

import { ApiError } from "@office/shared/lib/api";

/**
 * What every server action in this app returns.
 *
 * Three parts, each with a job: `error` is the sentence at the top of the
 * form, `fieldErrors` puts messages under individual inputs, and `values`
 * echoes what was typed so a failed submit does not empty the form.
 */
export interface FormState<Field extends string = string> {
  error?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: Record<string, string>;
  /** Set on success by actions that stay on the page instead of redirecting. */
  ok?: boolean;
  /** The API wants a fresh 2FA code first; the alert offers the way to give one. */
  stepUp?: boolean;
}

interface ProblemError {
  loc?: (string | number)[];
  msg?: string;
}

/**
 * Turn a thrown error into a sentence someone can act on — in their language.
 *
 * The API speaks RFC 9457, so `detail` is already written for a human in most
 * cases and is passed through for conflicts and validation. What the API
 * returns per field (`errors[].loc`) is mapped onto the form's own fields, so
 * the message lands under the input it is about instead of as one opaque
 * "Request validation failed." at the top. `subject` names the record in a
 * not-found message.
 */
export async function describeApiError(
  error: unknown,
  subject: string,
): Promise<{ error: string; fieldErrors?: Record<string, string[]>; stepUp?: boolean }> {
  const t = await getTranslations("errors");
  const tSubject = await getTranslations("subjects");
  if (error instanceof ApiError) {
    if (error.status === 404) {
      const name = tSubject.has(subject) ? tSubject(subject) : subject;
      return { error: t("notFound", { subject: name }) };
    }
    if (error.status === 403 && error.code === "step_up_required") {
      return { error: t("stepUp"), stepUp: true };
    }
    if (error.status === 403) return { error: t("forbidden") };
    // The package's orders for the month are used up; the API's sentence is English only.
    if (error.code === "package_limit_reached") return { error: t("packageLimit") };
    if (error.status === 429) return { error: t("rateLimited") };
    if (error.status === 409) return { error: error.detail };
    if (error.status === 422) {
      const body = (error.body ?? {}) as { errors?: ProblemError[] };
      const fieldErrors: Record<string, string[]> = {};
      for (const problem of body.errors ?? []) {
        const loc = (problem.loc ?? []).filter(
          (part) => !["body", "query", "path"].includes(String(part)),
        );
        // Inside a list (an order's documents) the full path, as
        // `validationFailedByPath` keys it: "documents.0.source_language".
        // Otherwise the field's own name, which is what flat forms use.
        const field = loc.some((part) => typeof part === "number")
          ? loc.join(".")
          : [...loc].reverse().find((part) => typeof part === "string");
        if (typeof field === "string" && field) {
          (fieldErrors[field] ??= []).push(problem.msg ?? error.detail);
        }
      }
      return {
        error: t("rejected", { detail: error.detail }),
        ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
      };
    }
    if (error.status >= 500) {
      // The detail is for the logs; the person gets something they can act on.
      console.error(`[api] ${error.status}: ${error.detail}`);
      return { error: t("server") };
    }
    return { error: error.detail };
  }
  return { error: t("unreachable") };
}

/**
 * What a quick-add dialog's server action returns.
 *
 * Like `FormState`, but on success it hands back the created record itself
 * rather than `ok: true` — the caller needs it right away, to select it in
 * whichever field opened the dialog.
 */
export interface QuickAddState<T, Field extends string = string> extends FormState<Field> {
  item?: T;
}

/** Read the named keys off FormData as strings. FormData has no other type. */
export function readStrings<K extends string>(
  formData: FormData,
  keys: readonly K[],
): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const key of keys) out[key] = String(formData.get(key) ?? "");
  return out;
}

/**
 * Send only what changed.
 *
 * PATCH semantics: a field the user did not touch should not be written at
 * all, so an edit made by someone else between this page loading and the form
 * being saved survives. `writeOnly` names fields the API never returns — those
 * cannot be diffed, so they are sent only when non-empty, and a blank one
 * means "leave it alone" rather than "clear it".
 */
export function changedFields<T extends Record<string, unknown>>(
  next: T,
  current: Record<string, unknown> | null,
  raw: Record<string, string>,
  writeOnly: readonly string[] = [],
): Partial<T> {
  const changes: Partial<T> = {};

  for (const [key, value] of Object.entries(next)) {
    if (writeOnly.includes(key)) {
      if (raw[key]?.trim()) (changes as Record<string, unknown>)[key] = value;
      continue;
    }
    // A failed re-read leaves `current` null; then everything is sent, which
    // is worse than a precise diff but better than refusing to save.
    if (current === null || value !== current[key]) {
      (changes as Record<string, unknown>)[key] = value;
    }
  }

  return changes;
}

/**
 * A failed zod parse, as a form state — in the reader's language.
 *
 * Schemas state their messages as catalogue keys under `validation`,
 * optionally with one parameter after a colon (`"maxChars:255"`), so the same
 * schema reads correctly in Georgian and English. A message that is not a
 * key (zod's own defaults) passes through unchanged.
 */
export async function validationFailed(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Promise<{ error: string; fieldErrors: Record<string, string[]> }> {
  const t = await getTranslations("validation");
  const fieldErrors: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    if (!messages?.length) continue;
    fieldErrors[field] = messages.map((message) => translateMessage(t, message));
  }
  return { error: t("checkFields"), fieldErrors };
}

/**
 * Like `validationFailed`, but keyed by each problem's full path, for a form
 * that holds a list: "documents.0.source_language" rather than everything
 * about every document heaped onto "documents". The order form used to show
 * those as bare "Choose one." lines above the card, with no way to tell which
 * field of which document they meant (audit F02).
 */
export async function validationFailedByPath(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}): Promise<{ error: string; fieldErrors: Record<string, string[]> }> {
  const t = await getTranslations("validation");
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    const message = translateMessage(t, issue.message);
    const list = (fieldErrors[key] ??= []);
    if (!list.includes(message)) list.push(message);
  }
  return { error: t("checkFields"), fieldErrors };
}

/** A schema message is a `validation` key, optionally with one parameter after a colon. */
function translateMessage(
  t: Awaited<ReturnType<typeof getTranslations<"validation">>>,
  message: string,
): string {
  const [key, param] = message.split(":", 2);
  if (!t.has(key)) return message;
  return param === undefined ? t(key) : t(key, { count: Number(param) || param });
}
