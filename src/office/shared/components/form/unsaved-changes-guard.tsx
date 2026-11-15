"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type RefObject } from "react";

import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@office/shared/components/ui/dialog";

/** Controls that change a value by click rather than by an input event. */
const CLICK_EDITS = "[role='checkbox'], [role='switch'], [role='radio'], [aria-pressed]";

/**
 * Asks before a half-filled form is left behind.
 *
 * Changing an order's pages from 3 to 4 and then clicking Dashboard used to
 * throw the edit away without a word (audit F08). Once someone has typed or
 * picked anything in the form, a link that would leave the page asks first,
 * and closing or reloading the tab gets the browser's own warning.
 *
 * Dirty means "the person touched a control", not "the values differ":
 * hidden fields that the form recalculates itself (the order's documents,
 * re-priced when a quote arrives) must not count as an edit nobody made.
 * Saving and leaving is the form's own business (a redirect or a router push),
 * which never passes through a link, so it is not intercepted.
 *
 * `resetOn`: for a form that saves and stays on the page, pass something that
 * changes on each successful save (the action's state when `ok`); the form
 * is clean again from there.
 */
export function UnsavedChangesGuard({
  formRef,
  resetOn,
  onDirtyChange,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  resetOn?: unknown;
  /**
   * Told whenever the form goes from untouched to edited or back, for a
   * form that shows its Save bar only once there is something to save.
   * Pass a stable function (a state setter).
   */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("unsaved");
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [lastReset, setLastReset] = useState(resetOn);
  if (resetOn !== lastReset) {
    setLastReset(resetOn);
    if (resetOn) setDirty(false);
  }

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Watch the form for the first real edit.
  useEffect(() => {
    const form = formRef.current;
    if (!form || dirty) return;
    const mark = (event: Event) => {
      // Only what a person does. Scripts that set a hidden input fire nothing.
      if (!event.isTrusted) return;
      if (event.type === "click" && !(event.target as Element).closest(CLICK_EDITS)) return;
      setDirty(true);
    };
    form.addEventListener("input", mark);
    form.addEventListener("change", mark);
    form.addEventListener("click", mark);
    return () => {
      form.removeEventListener("input", mark);
      form.removeEventListener("change", mark);
      form.removeEventListener("click", mark);
    };
  }, [formRef, dirty]);

  // Once dirty: catch links out of the page, and closing or reloading the tab.
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // A new tab or window leaves this one as it is.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      const here = new URL(window.location.href);
      // An anchor on this same page does not leave it.
      if (url.pathname === here.pathname && url.search === here.search) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.href);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture, so this runs before Next's <Link> starts a navigation.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const leave = () => {
    if (!pendingHref) return;
    const url = new URL(pendingHref);
    setDirty(false);
    setPendingHref(null);
    if (url.origin === window.location.origin) {
      router.push(`${url.pathname}${url.search}${url.hash}`);
    } else {
      window.location.assign(url.href);
    }
  };

  return (
    <Dialog open={pendingHref !== null} onOpenChange={(open) => !open && setPendingHref(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={TriangleAlert} hue="amber">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {/* Stacked and full width: the two Georgian labels are each wider than
            half the dialog, and side by side the first ran off its left edge. */}
        <DialogFooter className="sm:flex-col-reverse sm:items-stretch">
          <Button type="button" variant="outline" onClick={() => setPendingHref(null)} autoFocus>
            {t("stay")}
          </Button>
          <Button type="button" variant="destructive" onClick={leave}>
            {t("leave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
