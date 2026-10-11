"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getAllLanguages, type Language } from "@/features/translation/services/languageService";
import { MAX_DOCUMENT_UPLOAD_BYTES } from "@/features/translation/constants/uploadLimits";
import { fetchAssignedOrder, fetchOrderFile } from "./api";
import { languageIdForCode } from "./languages";
import type { OrderSourceRef } from "./orderTranslations";

/**
 * A bureau's file, brought to the ordinary document screen.
 *
 * "Translate" on an assigned order does not translate anything itself: it
 * opens /document with the file named in the address, and from there the
 * translator works as with any document of their own (the quote, the brief,
 * names, notes, the editor). This is the part that fetches the file.
 */

/** What the document screen takes: the kinds its own file picker offers. */
const TRANSLATABLE = /\.(pdf|docx|doc|txt|md|markdown|srt|jpe?g|png)$/i;

export const isTranslatable = (fileName: string) => TRANSLATABLE.test(fileName);

/** The address of the document screen with one file of an order in it. */
export function translateHref(source: Pick<OrderSourceRef, "slug" | "orderId" | "documentId" | "fileId">) {
  const query = new URLSearchParams({
    bureau: source.slug,
    order: String(source.orderId),
    doc: String(source.documentId),
    file: source.fileId,
  });
  return `/document?${query.toString()}`;
}

export type OrderSourceState =
  /** The address names no order: an ordinary visit. */
  | { status: "none" }
  | { status: "loading" }
  | {
      status: "ready";
      source: OrderSourceRef;
      file: File;
      /** This site's ids for the document's languages, where it has them. */
      sourceLanguageId: number | null;
      targetLanguageId: number | null;
    }
  /** Something stood in the way. `back` is the order to return to. */
  | { status: "signedOut" | "gone" | "tooLarge" | "error"; back: string };

/**
 * The order's file named in the address (`?bureau=&order=&doc=&file=`), fetched.
 *
 * Once a translation starts, the document screen rewrites its address to the
 * translation's own; what was loaded stays as it is then.
 */
export function useOrderSource(): OrderSourceState {
  const params = useSearchParams();
  const slug = params.get("bureau");
  const orderId = params.get("order");
  const documentId = Number(params.get("doc"));
  const fileId = params.get("file");
  const named = Boolean(slug && orderId && documentId && fileId);
  const signedIn = useAuthStore((state) => Boolean(state.token));
  const [state, setState] = useState<OrderSourceState>({ status: "none" });

  useEffect(() => {
    if (!named || !slug || !orderId || !fileId) return;
    const back = `/orders/${slug}/${orderId}`;
    if (!signedIn) {
      setState({ status: "signedOut", back });
      return;
    }

    let cancelled = false;
    const settle = (next: OrderSourceState) => {
      if (!cancelled) setState(next);
    };
    setState({ status: "loading" });

    (async () => {
      const order = await fetchAssignedOrder(slug, orderId);
      if (order.status === "signedOut") return settle({ status: "signedOut", back });
      if (order.status === "notFound" || order.status === "notTranslator") {
        return settle({ status: "gone", back });
      }
      if (order.status !== "ok") return settle({ status: "error", back });

      const document = order.data.documents.find((candidate) => candidate.id === documentId);
      const listed = document?.files.find((candidate) => candidate.id === fileId);
      if (!document || !listed || !listed.downloadable) return settle({ status: "gone", back });
      if ((listed.size_bytes ?? 0) > MAX_DOCUMENT_UPLOAD_BYTES) {
        return settle({ status: "tooLarge", back });
      }

      const [loaded, languages] = await Promise.all([
        fetchOrderFile(slug, order.data.order_id, document.id, listed),
        // Without the list the languages are simply left for the translator to choose.
        (getAllLanguages() as Promise<Language[]>).catch(() => [] as Language[]),
      ]);
      if (loaded.status === "signedOut") return settle({ status: "signedOut", back });
      if (loaded.status !== "ok") return settle({ status: "error", back });
      if (loaded.file.size > MAX_DOCUMENT_UPLOAD_BYTES) return settle({ status: "tooLarge", back });

      settle({
        status: "ready",
        file: loaded.file,
        source: {
          slug,
          orderId: order.data.order_id,
          documentId: document.id,
          fileId: listed.id,
          orderNumber: order.data.order_number ?? null,
          organization: order.data.organization.name,
          documentName: document.document_type_name,
          fileName: listed.name,
        },
        sourceLanguageId: languageIdForCode(document.source_language, languages),
        targetLanguageId: languageIdForCode(document.target_language, languages),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [named, slug, orderId, documentId, fileId, signedIn]);

  return state;
}

/**
 * Which order the file now on the document screen came from.
 *
 * Tied to the file itself (the very `FileList` the screen holds), not to the
 * address: it survives a look at another page and back, and it ends by itself
 * the moment another file is chosen.
 */
type HandOff = { files: FileList; source: OrderSourceRef };

export const useOrderHandOffStore = create<{
  handOff: HandOff | null;
  setHandOff: (handOff: HandOff | null) => void;
}>()((set) => ({
  handOff: null,
  setHandOff: (handOff) => set({ handOff }),
}));

/** The order `files` came from, if it is the file that was brought from one. */
export function useOrderOfFile(files: FileList | null): OrderSourceRef | null {
  const handOff = useOrderHandOffStore((state) => state.handOff);
  return files && handOff?.files === files ? handOff.source : null;
}
