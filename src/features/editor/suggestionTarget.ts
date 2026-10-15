import { useSyncExternalStore } from "react";

/**
 * Where a suggestion is applied when the translation is in the Word editor.
 *
 * With the simple editor a suggestion is a string replacement in the translation's HTML, which
 * is also the editor's content. The Word editor keeps its own document, which would be thrown
 * away if the HTML were replaced under it, so the suggestions panel asks the editor to find
 * and replace the text instead. The editor registers itself here while it is on the page.
 */
export interface SuggestionTarget {
  /** Whether the quote is in the document as it stands. */
  has(text: string): boolean;
  /** Replaces the quote everywhere it is; answers how many places. */
  replace(find: string, replacement: string): number;
}

let target: SuggestionTarget | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());

/** Registers the editor on the page; the returned function takes it off again. */
export function registerSuggestionTarget(next: SuggestionTarget): () => void {
  target = next;
  changed();
  return () => {
    if (target === next) {
      target = null;
      changed();
    }
  };
}

export function getSuggestionTarget(): SuggestionTarget | null {
  return target;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The editor suggestions are applied in, as it comes and goes; null for the simple editor. */
export function useSuggestionTarget(): SuggestionTarget | null {
  return useSyncExternalStore(subscribe, getSuggestionTarget, () => null);
}
