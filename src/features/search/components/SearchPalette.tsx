"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/features/ui/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { searchTranslations, type TranslationHit } from "../services/searchService";

const DEBOUNCE_MS = 250;

interface Item {
  key: string;
  href: string;
  icon: ReactNode;
  label: string;
  detail?: ReactNode;
}

/** Translate's own pages, by the key their label has in the Search texts. */
const PAGES = [
  { key: "text", href: "/text", icon: Plus },
  { key: "passport", href: "/passport", icon: FileText },
  { key: "projects", href: "/projects", icon: FolderOpen },
  { key: "history", href: "/history", icon: History },
  { key: "orders", href: "/assignments", icon: ClipboardList },
  { key: "billing", href: "/profile#billing", icon: CreditCard },
  { key: "profile", href: "/profile", icon: User },
  { key: "price", href: "/price", icon: BadgeDollarSign },
  { key: "help", href: "/help", icon: CircleHelp },
] as const;

/**
 * Ctrl+K: jump to a page of Translate or to one of your own translations,
 * found by part of its file name or title. Pages are matched here; translations
 * go to the API a quarter-second after typing stops. Arrow keys move, Enter
 * opens, Esc closes. Before anything is typed it offers the pages.
 */
export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<TranslationHit[]>([]);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const latest = useRef("");

  // A fresh box each time it opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setFailed(false);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    latest.current = trimmed;
    if (!trimmed) {
      setHits([]);
      setPending(false);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    setPending(true);
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchTranslations(trimmed, controller.signal);
        // Only the answer to what is in the box now.
        if (latest.current === trimmed) {
          setHits(found);
          setFailed(false);
          setActive(0);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && latest.current === trimmed) {
          setHits([]);
          setFailed(true);
        }
      } finally {
        if (latest.current === trimmed) setPending(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const typed = query.trim() !== "";

  const pages: Item[] = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return PAGES.map((p) => ({
      key: `page-${p.key}`,
      href: p.href,
      icon: <p.icon className="size-4" />,
      label: t(`pages.${p.key}`),
    })).filter((item) => !needle || item.label.toLocaleLowerCase().includes(needle));
  }, [query, t]);

  const groups: { title: string; items: Item[] }[] = [
    { title: t("pagesTitle"), items: pages },
    {
      title: t("translations"),
      items: hits.map((hit) => ({
        key: `chat-${hit.chatId}`,
        href: `/translations/${hit.chatId}`,
        icon: <FileText className="size-4" />,
        label: hit.title,
        detail: hit.targetLanguage ? <span className="text-muted-foreground text-xs">{hit.targetLanguage}</span> : undefined,
      })),
    },
  ].filter((group) => group.items.length > 0);

  const flat = groups.flatMap((g) => g.items);

  const go = (item: Item) => {
    onOpenChange(false);
    router.push(item.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (flat.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flat[Math.min(active, flat.length - 1)];
      if (item) go(item);
    }
  };

  // Keep the highlighted row in view as the arrows move it.
  useEffect(() => {
    document.getElementById(`translate-search-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let index = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <div className="border-border flex items-center gap-2 border-b px-3 pr-10">
          {pending ? (
            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          )}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="translate-search-results"
            aria-activedescendant={flat.length > 0 ? `translate-search-${active}` : undefined}
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div id="translate-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {typed && flat.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              {failed ? t("failed") : pending ? t("searching") : t("nothing")}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="mb-2 last:mb-0">
                <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{group.title}</p>
                {group.items.map((item) => {
                  index += 1;
                  const position = index;
                  const selected = position === active;
                  return (
                    <button
                      key={item.key}
                      id={`translate-search-${position}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => setActive(position)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-sm",
                        selected ? "bg-accent text-accent-foreground" : "text-foreground",
                      )}
                    >
                      <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.detail && <span className="shrink-0">{item.detail}</span>}
                      {selected && <ArrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
          {!typed && <p className="text-muted-foreground border-border mt-1 border-t px-2 pt-3 pb-1 text-xs">{t("hint")}</p>}
        </div>

        <div className="border-border text-muted-foreground bg-muted/30 hidden items-center gap-4 border-t px-3 py-2 text-xs sm:flex">
          {[
            ["↑ ↓", t("keyMove")],
            ["Enter", t("keyOpen")],
            ["Esc", t("keyClose")],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="border-border bg-background rounded border px-1.5 py-0.5 text-xs">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
