"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import {
  createComment,
  deleteComment,
  listMentionablePeople,
  markAllRead,
  markRead,
  setCommentPinned,
  type MentionablePerson,
} from "@office/features/notifications/api";
import { describeApiError } from "@office/shared/lib/form-state";
import { revalidateRoute } from "@office/shared/lib/revalidate";

/**
 * Notification and comment mutations.
 *
 * All of these are small state changes with no form to validate, so they take
 * FormData with one or two ids rather than going through Zod. The API
 * re-checks ownership on every one — marking someone else's notification read
 * is a 404 there, not something this file prevents.
 */

export interface ActionState {
  error?: string;
  ok?: boolean;
  /** A note that failed to post, handed back so it is not lost. */
  body?: string;
  stepUp?: boolean;
}

async function invalid(key: "invalid" | "empty" | "tooLong", body?: string): Promise<ActionState> {
  return { error: (await getTranslations("comments.errors"))(key), body };
}

export async function markAllReadAction(): Promise<ActionState> {
  try {
    await markAllRead();
  } catch (error) {
    return describeApiError(error, "notification");
  }
  revalidateRoute("/notifications");
  revalidateRoute("/", "layout");
  return { ok: true };
}

export async function markReadAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return invalid("invalid");

  try {
    await markRead(id);
  } catch (error) {
    return describeApiError(error, "notification");
  }
  revalidateRoute("/notifications");
  return { ok: true };
}

export async function addCommentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = Number(formData.get("order_id"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(orderId) || orderId <= 0) return invalid("invalid", body);
  if (!body) return invalid("empty");
  // Matches the API's own limit, so an over-long note fails here with a clear
  // message instead of coming back as a 422.
  if (body.length > 5000) return invalid("tooLong", body);

  try {
    await createComment(orderId, { body });
  } catch (error) {
    return { ...(await describeApiError(error, "comment")), body };
  }
  revalidateRoute(`/translations/${orderId}`);
  return { ok: true };
}

/**
 * The colleagues the note box can offer after "@". Empty, not an error box,
 * when they cannot be loaded: typing the name by hand still works, which is
 * all the dropdown ever did for you.
 */
export async function mentionablePeopleAction(orderId: number): Promise<MentionablePerson[]> {
  if (!Number.isInteger(orderId) || orderId <= 0) return [];
  try {
    return await listMentionablePeople(orderId);
  } catch {
    return [];
  }
}

export async function pinCommentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = Number(formData.get("order_id"));
  const commentId = Number(formData.get("comment_id"));
  const pinned = formData.get("is_pinned") === "true";
  if (!Number.isInteger(orderId) || !Number.isInteger(commentId)) return invalid("invalid");

  try {
    await setCommentPinned(orderId, commentId, pinned);
  } catch (error) {
    return describeApiError(error, "comment");
  }
  revalidateRoute(`/translations/${orderId}`);
  return { ok: true };
}

export async function deleteCommentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orderId = Number(formData.get("order_id"));
  const commentId = Number(formData.get("comment_id"));
  if (!Number.isInteger(orderId) || !Number.isInteger(commentId)) return invalid("invalid");

  try {
    await deleteComment(orderId, commentId);
  } catch (error) {
    return describeApiError(error, "comment");
  }
  revalidateRoute(`/translations/${orderId}`);
  return { ok: true };
}
