"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { GO_TARGETS } from "./definitions";

interface ShortcutsContextValue {
  /** True while Alt is held, so the sidebar can show every digit at once. */
  altHeld: boolean;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue>({
  altHeld: false,
  helpOpen: false,
  setHelpOpen: () => {},
});

export const useShortcuts = () => useContext(ShortcutsContext);

/** A place where typing letters is the point, so letters must not act. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    "input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='combobox'], [role='textbox']",
  );
}

/** A dialog or menu is open: it owns the keyboard. */
function overlayOpen(): boolean {
  return !!document.querySelector(
    "[role='dialog']:not([data-state='closed']), [role='alertdialog']:not([data-state='closed']), [role='menu']:not([data-state='closed'])",
  );
}

/**
 * The physical key. Some input sources (remote desktops, on-screen
 * keyboards, scripted events) leave `code` empty; the character then stands
 * in, which is right on the Latin layout those are used with.
 */
function physicalKey(event: KeyboardEvent): string {
  if (event.code) return event.code;
  if (/^[a-z]$/i.test(event.key)) return `Key${event.key.toUpperCase()}`;
  if (/^[0-9]$/.test(event.key)) return `Digit${event.key}`;
  if (event.key === "/" || event.key === "?") return "Slash";
  return "";
}

/** Click the first visible, enabled control carrying this marker. */
function press(marker: string): boolean {
  const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-shortcut='${marker}']`)).find(
    (candidate) => candidate.getClientRects().length > 0 && !(candidate as HTMLButtonElement).disabled,
  );
  if (!el) return false;
  el.click();
  return true;
}

/**
 * Keyboard shortcuts for the signed-in app, and the state the sidebar and the
 * cheat sheet read.
 *
 * The controls a shortcut acts on carry `data-shortcut="..."` and are clicked,
 * so a shortcut does exactly what the button does, including its checks (a
 * disabled button stays disabled). Chords with Ctrl or the command key work
 * anywhere; Alt+letter and single keys stay out of text fields, because on a
 * Polish or Mac layout Alt (or Option) is how letters like ś and ł are typed.
 */
export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [altHeld, setAltHeld] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const goTo = (digit: string) => {
      const target = GO_TARGETS.find((entry) => entry.digit === digit);
      if (!target || (target.requiresAuth && !token)) return false;
      if (target.startsNew) {
        useTextTranslationStore.getState().reset();
        useDocumentTranslationStore.getState().reset();
      }
      router.push(target.href);
      return true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Alt") setAltHeld(true);
      if (event.defaultPrevented || event.isComposing) return;

      const code = physicalKey(event);
      const mod = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd+Enter sends the form the cursor is in. Works while typing,
      // which is when it is wanted.
      if (mod && event.key === "Enter" && !event.altKey) {
        const form = (event.target as Element | null)?.closest?.("form");
        if (form) {
          event.preventDefault();
          form.requestSubmit();
        }
        return;
      }

      // Alt with a digit: a screen. A chord, so it is safe while typing. Not
      // with Ctrl as well: that is AltGr, which types characters.
      if (event.altKey && !mod && !event.shiftKey && code.startsWith("Digit")) {
        if (goTo(code.slice(5))) event.preventDefault();
        return;
      }

      // Alt with a letter: acts on the translation in front of you.
      if (event.altKey && !mod && code.startsWith("Key")) {
        if (isTyping(event.target) || overlayOpen()) return;
        const marker = event.shiftKey
          ? { KeyC: "copy", KeyD: "download" }[code]
          : { KeyS: "swap", KeyL: "target-language" }[code];
        if (marker && press(marker)) event.preventDefault();
        return;
      }

      if (mod || event.altKey) return;
      if (isTyping(event.target) || overlayOpen()) return;

      if (code === "Slash") {
        if (event.shiftKey) {
          event.preventDefault();
          setHelpOpen(true);
        } else {
          const input = document.querySelector<HTMLElement>("[data-shortcut='input']");
          if (input) {
            event.preventDefault();
            input.focus();
          }
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") setAltHeld(false);
    };
    const onBlur = () => setAltHeld(false);

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [router, token]);

  const value = useMemo(() => ({ altHeld, helpOpen, setHelpOpen }), [altHeld, helpOpen]);
  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}
