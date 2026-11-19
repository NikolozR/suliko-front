"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAllLanguages, Language } from "@/features/translation/services/languageService";
import { useAuthStore } from "@/features/auth/store/authStore";
import { AuthModal } from "@/features/auth";
import { useLocale, useTranslations } from "next-intl";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { cn } from "@/shared/lib/utils";
import { Check, ChevronDown, Search, Star } from "lucide-react";

interface CustomLanguage {
  value: number;
  label: string;
}

interface LanguageSelectProps {
  value: number;
  onChange: (value: number) => void;
  detectOption?: string;
  languages?: CustomLanguage[];
  /** Marks the trigger for a keyboard shortcut, see `ShortcutsProvider`. */
  shortcut?: string;
}

type AnyLanguage = Language | CustomLanguage;

// Favourites (the stars) come first, the rest alphabetically. Until the person
// stars something, English and Georgian are the favourites (English first).
const FAVORITES_KEY = "suliko-favorite-languages-v1";

const readStoredFavorites = (): number[] | null => {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((n) => typeof n === "number") ? parsed : null;
  } catch {
    return null;
  }
};

const getLanguageSortRank = (name: string): number => {
  const normalized = name.toLowerCase();
  if (normalized.includes("english")) return 0;
  if (normalized.includes("georgian")) return 1;
  return 2;
};

const getRawName = (lang: AnyLanguage): string =>
  "name" in lang ? lang.name : lang.label;

const getId = (lang: AnyLanguage): number =>
  "id" in lang ? lang.id : lang.value;


const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  detectOption,
  languages: customLanguages,
  shortcut,
}) => {
  const [languages, setLanguages] = useState<AnyLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // null = never starred anything, so the defaults apply.
  const [storedFavorites, setStoredFavorites] = useState<number[] | null>(null);
  const locale = useLocale();
  const t = useTranslations("CommonLanguageSelect");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStoredFavorites(readStoredFavorites());
  }, []);

  useEffect(() => {
    if (customLanguages) {
      setLanguages(customLanguages);
      setLoading(false);
      return;
    }
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await getAllLanguages();
        setLanguages(data);
      } catch {
        setLanguages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [customLanguages]);

  const getDisplayLabel = (lang: AnyLanguage): string =>
    "label" in lang
      ? lang.label
      : locale === "ka"
        ? lang.nameGeo
        : lang.name.replace(" Language", "");

  const getSearchText = (lang: AnyLanguage): string =>
    "label" in lang
      ? lang.label.toLowerCase()
      : `${lang.name} ${lang.nameGeo}`.toLowerCase();

  const normalizedQuery = query.trim().toLowerCase();

  // The starred languages: the person's own, or English and Georgian until
  // they star something.
  const favoriteIds = useMemo(
    () =>
      new Set<number>(
        storedFavorites ??
          languages.filter((lang) => getLanguageSortRank(getRawName(lang)) < 2).map(getId)
      ),
    [storedFavorites, languages]
  );

  // Favourites first (English, then Georgian, then the rest of them by name),
  // then everything else alphabetically by the *displayed* label using the
  // active locale's collation, so the Georgian UI orders by the Georgian
  // alphabet, not by the English name.
  const sortedLanguages = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    return [...languages].sort((a, b) => {
      const favA = favoriteIds.has(getId(a));
      const favB = favoriteIds.has(getId(b));
      if (favA !== favB) return favA ? -1 : 1;
      if (favA) {
        const rankA = getLanguageSortRank(getRawName(a));
        const rankB = getLanguageSortRank(getRawName(b));
        if (rankA !== rankB) return rankA - rankB;
      }
      return collator.compare(getDisplayLabel(a), getDisplayLabel(b));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages, locale, favoriteIds]);

  const toggleFavorite = (id: number) => {
    const next = new Set(favoriteIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const list = [...next];
    setStoredFavorites(list);
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch {
      // Private mode or full storage: the stars last for this visit only.
    }
  };

  const filtered = useMemo(
    () =>
      normalizedQuery
        ? sortedLanguages.filter((lang) => getSearchText(lang).includes(normalizedQuery))
        : sortedLanguages,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedLanguages, normalizedQuery]
  );

  const pinned = normalizedQuery ? [] : filtered.filter((lang) => favoriteIds.has(getId(lang)));
  const rest = normalizedQuery ? filtered : filtered.filter((lang) => !favoriteIds.has(getId(lang)));

  const showDetect =
    !!detectOption && (!normalizedQuery || detectOption.toLowerCase().includes(normalizedQuery));

  // Flat list of selectable options in visual order, used for keyboard navigation.
  const flatOptions = useMemo(() => {
    const opts: Array<{ id: number; label: string; isDetect?: boolean }> = [];
    if (showDetect && detectOption) opts.push({ id: 0, label: detectOption, isDetect: true });
    for (const lang of pinned) opts.push({ id: getId(lang), label: getDisplayLabel(lang) });
    for (const lang of rest) opts.push({ id: getId(lang), label: getDisplayLabel(lang) });
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetect, detectOption, pinned, rest, locale]);

  // Index in flatOptions where the alphabetical "rest" section begins.
  const restStartIndex = (showDetect ? 1 : 0) + pinned.length;

  const selectedLanguage = languages.find((lang) => getId(lang) === value);
  const displayValue = selectedLanguage
    ? getDisplayLabel(selectedLanguage)
    : value === 0 && detectOption
      ? detectOption
      : "";

  const openMenu = () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setQuery("");
    const selectedIdx = flatOptions.findIndex((o) => o.id === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (id: number) => {
    onChange(id);
    closeMenu();
  };

  // Focus the search box when the menu opens.
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Clamp the active index whenever the visible option set changes.
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, flatOptions.length - 1)));
  }, [flatOptions.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = flatOptions[activeIndex];
      if (opt) handleSelect(opt.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <LoadingSpinner size="sm" variant="primary" />
        <span className="text-sm text-muted-foreground">{t("selectLanguagePlaceholder")}</span>
      </div>
    );

  const triggerClasses =
    "border-input dark:bg-input/30 dark:hover:bg-input/50 flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-4 py-2 text-[15px] shadow-xs transition-[color,box-shadow] outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  const renderOption = (
    opt: { id: number; label: string; isDetect?: boolean },
    index: number
  ) => {
    const selected = opt.id === value;
    const active = index === activeIndex;
    const favorite = !opt.isDetect && favoriteIds.has(opt.id);
    return (
      <div
        key={`${opt.id}-${opt.isDetect ? "detect" : "lang"}`}
        data-index={index}
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => handleSelect(opt.id)}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none",
          active ? "bg-accent text-accent-foreground" : "text-popover-foreground"
        )}
      >
        {opt.isDetect ? (
          <span className="size-6 shrink-0" />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            aria-pressed={favorite}
            aria-label={`${favorite ? t("removeFavorite") : t("addFavorite")}: ${opt.label}`}
            // The row is the click target for choosing; the star must not choose.
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(opt.id);
            }}
            className="relative -ml-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-accent-text before:absolute before:-inset-2 before:content-['']"
          >
            <Star
              className={cn(
                "size-3.5 transition-colors",
                favorite && "fill-suliko-default-color text-accent-text"
              )}
              aria-hidden
            />
          </button>
        )}
        <span className="flex-1 truncate">{opt.label}</span>
        {selected && <Check className="size-4 shrink-0 text-accent-text" />}
      </div>
    );
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          className={triggerClasses}
          onClick={() => (open ? closeMenu() : openMenu())}
          data-shortcut={shortcut}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn("line-clamp-1 text-left", !displayValue && "text-muted-foreground")}>
            {displayValue || t("selectLanguagePlaceholder")}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            <div className="flex items-center gap-2 border-b px-3 transition-shadow focus-within:shadow-[inset_0_-2px_0_var(--accent-text)]">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
                aria-label={t("searchPlaceholder")}
                // The page-wide keyboard ring would be clipped by this box, so the row
                // shows focus with an accent underline instead (inline: it has to beat
                // the unlayered global rule).
                style={{ outline: "none" }}
              />
            </div>

            <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto p-1">
              {flatOptions.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </div>
              ) : (
                flatOptions.map((opt, index) => (
                  <React.Fragment key={`${opt.id}-${opt.isDetect ? "detect" : "lang"}`}>
                    {!normalizedQuery && pinned.length > 0 && index === restStartIndex && (
                      <div className="my-1 h-px bg-border" />
                    )}
                    {renderOption(opt, index)}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default LanguageSelect;
