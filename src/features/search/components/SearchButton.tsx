"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { SearchPalette } from "./SearchPalette";

/**
 * The search box in the top bar for someone with Translate only (Office's own
 * box serves those signed in to Office): a wide button on a desktop, an icon
 * on a phone, and Ctrl+K / Cmd+K anywhere.
 */
export function SearchButton() {
  const t = useTranslations("Search");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("title")}
        className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-2.5 text-sm text-white transition-colors hover:bg-white/15 pointer-coarse:h-11 md:mr-1 md:w-56 md:justify-start md:bg-white/10"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden flex-1 text-left text-white/80 md:inline">{t("button")}</span>
        <kbd className="hidden rounded border border-white/30 px-1.5 text-xs text-white/80 md:inline">Ctrl K</kbd>
      </button>
      {open && <SearchPalette open={open} onOpenChange={setOpen} />}
    </>
  );
}
