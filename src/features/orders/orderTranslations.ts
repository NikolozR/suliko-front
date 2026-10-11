import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/features/auth/store/authStore";

/**
 * Which translation on this site was made for which document of a bureau's order.
 *
 * A translator opens the bureau's file in the ordinary document screen, and the
 * translation that comes out is an ordinary one: it lives in their own history,
 * and nothing on the server ties it to the order. This note is that tie, kept
 * in the browser, so the result can offer "Send to order" and the order can
 * point back at the translation.
 *
 * It is a convenience, not a record. In another browser the translation is
 * still in the history and the order still takes an upload; only the shortcut
 * between the two is missing.
 */

const STORAGE_KEY = "suliko:order-translations";
/** Old notes fall off the end: enough for months of work, small enough to read every time. */
const KEPT = 100;

/** One file of one document of one order, with the names people know it by. */
export type OrderSourceRef = {
  slug: string;
  orderId: number;
  documentId: number;
  fileId: string;
  orderNumber: number | null;
  organization: string;
  documentName: string | null;
  fileName: string;
};

export type OrderTranslationNote = OrderSourceRef & {
  chatId: string;
  /** Whose translation it is: a browser can be shared. */
  userId: string;
  startedAt: number;
  /** The file last sent to the order from this translation. */
  sent?: { name: string; at: number };
};

/** The suliko.ge account signed in here, or null. */
export function signedInUserId(): string | null {
  const { token } = useAuthStore.getState();
  if (!token) return null;
  try {
    return jwtDecode(token).sub ?? null;
  } catch {
    return null;
  }
}

function read(): OrderTranslationNote[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? (stored as OrderTranslationNote[]) : [];
  } catch {
    return [];
  }
}

function write(notes: OrderTranslationNote[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, KEPT)));
  } catch {
    // Storage is full or switched off: the shortcut is lost, nothing else.
  }
}

/** Note that `chatId` is the translation of this file of the order. */
export function noteOrderTranslation(chatId: string, source: OrderSourceRef): void {
  const userId = signedInUserId();
  if (!userId) return;
  const others = read().filter((note) => note.chatId !== chatId);
  write([{ ...source, chatId, userId, startedAt: Date.now() }, ...others]);
}

/** The order this translation was made for, if it was made for one here. */
export function orderOfTranslation(chatId: string): OrderTranslationNote | null {
  const userId = signedInUserId();
  return read().find((note) => note.chatId === chatId && note.userId === userId) ?? null;
}

/** This person's translations of one document's files, newest first. */
export function translationsOfDocument(
  slug: string,
  orderId: number,
  documentId: number,
): OrderTranslationNote[] {
  const userId = signedInUserId();
  return read().filter(
    (note) =>
      note.userId === userId &&
      note.slug === slug &&
      note.orderId === orderId &&
      note.documentId === documentId,
  );
}

/** Note that the translation was sent to its order as `name`. */
export function noteSentToOrder(chatId: string, name: string): OrderTranslationNote | null {
  const notes = read();
  const note = notes.find((candidate) => candidate.chatId === chatId);
  if (!note) return null;
  note.sent = { name, at: Date.now() };
  write(notes);
  return note;
}

/** Note that a file is no longer in the order, for whichever translation it was sent from. */
export function noteRemovedFromOrder(
  slug: string,
  orderId: number,
  documentId: number,
  name: string,
): void {
  const notes = read();
  let changed = false;
  for (const note of notes) {
    if (
      note.slug === slug &&
      note.orderId === orderId &&
      note.documentId === documentId &&
      note.sent?.name === name
    ) {
      delete note.sent;
      changed = true;
    }
  }
  if (changed) write(notes);
}
