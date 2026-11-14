"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ExternalLink, Keyboard, LogOut, Moon, PanelLeft, Sun, User } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUser } from "@/features/auth/hooks/useUser";
import { signOutEverywhere } from "@/features/auth/services/signOut";
import { OFFICE_URL, officeLocale } from "@/features/sulikoOffice/lib/officeLinks";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsProvider";
import SulikoLogoWhite from "../../../../public/Suliko_logo_white.svg";

/** A control on the gradient bar: white, with a faint white wash on hover. */
const BAR_BUTTON =
  "shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-white/15";

interface TopbarProps {
  /** What the server saw, so the first paint already shows the right side. */
  initiallySignedIn: boolean;
}

/**
 * Top bar: the same bar as Suliko Office's (shell/topbar.tsx there). Fixed,
 * full width, 56px, above the sidebar, on the Suliko gradient.
 *
 * Left: the sidebar switch, the mark, and where you are among Suliko's
 * products (Office has its organisation switcher in that place). Right: the
 * user menu with Profile, the shortcuts, the theme and Sign out, or Sign in
 * for a visitor.
 */
export default function Topbar({ initiallySignedIn }: TopbarProps) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const { token } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed!);
  const setIsCollapsed = useSidebarStore((state) => state.setIsCollapsed);

  useEffect(() => setIsClient(true), []);

  // As the sidebar does: until the browser has read its own token, go by what
  // the server saw, or every load would paint Sign in first and then swap it.
  const signedIn = Boolean(token) || (!isClient && initiallySignedIn);
  const officeHref = `${OFFICE_URL}/${officeLocale(locale)}/dashboard`;

  return (
    <header className="suliko-default-bg fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 px-3 text-white print:hidden">
      {/* The sidebar is a desktop thing; a phone has the bottom bar. */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={t("toggleSidebar")}
        aria-pressed={!isCollapsed}
        className={`${BAR_BUTTON} hidden size-9 md:inline-flex`}
      >
        <PanelLeft className="size-[1.1rem]" aria-hidden />
      </button>

      <Link
        href="/text"
        aria-label={t("home")}
        className="flex shrink-0 items-center rounded-md px-1.5 py-1 hover:bg-white/15"
      >
        <Image src={SulikoLogoWhite} alt="Suliko" width={80} height={20} priority />
      </Link>

      {/* Not on a phone: the bottom bar carries the way to Office there, and
          the two names do not fit beside the mark at 375px. */}
      {signedIn && (
        <div
          role="group"
          aria-label={t("products")}
          className="ml-1 hidden min-w-0 items-center gap-0.5 rounded-md bg-white/10 p-0.5 text-sm sm:flex"
        >
          <span aria-current="true" className="truncate rounded bg-white/20 px-2.5 py-1 font-medium">
            {t("translate")}
          </span>
          <a
            href={officeHref}
            className="flex items-center gap-1 truncate rounded px-2.5 py-1 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            {t("officeShort")}
            <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
          </a>
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {signedIn ? (
          <UserMenu />
        ) : (
          <>
            <ThemeButton />
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-white/10 px-3 text-sm font-medium transition-colors hover:bg-white/20 pointer-coarse:h-11"
            >
              <User className="size-4" aria-hidden />
              {t("login")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/** Light or dark, for a visitor, who has no menu to keep it in. */
function ThemeButton() {
  const t = useTranslations("Sidebar");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t("themeLight") : t("themeDark")}
      title={dark ? t("themeLight") : t("themeDark")}
      className={`${BAR_BUTTON} inline-flex size-9 pointer-coarse:size-11`}
    >
      {dark ? <Sun className="size-[1.1rem]" aria-hidden /> : <Moon className="size-[1.1rem]" aria-hidden />}
    </button>
  );
}

const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground pointer-coarse:py-3";

/**
 * The person's own things, as in Office's user menu: who they are, Profile,
 * the shortcuts, the theme, Sign out. These sat at the foot of the sidebar.
 */
function UserMenu() {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const { userProfile, initials, displayName } = useUser();
  const { setHelpOpen } = useShortcuts();
  const { resolvedTheme, setTheme } = useTheme();
  const resetTextTranslation = useTextTranslationStore((s) => s.reset);
  const resetDocumentTranslation = useDocumentTranslationStore((s) => s.reset);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Closes on a press anywhere else and on Escape, which hands focus back.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const dark = mounted && resolvedTheme === "dark";
  const name = userProfile ? displayName.trim() || userProfile.userName : "";
  // A placeholder address from registering by phone: Profile asks for a real one.
  const needsEmail = Boolean(userProfile?.email?.toLowerCase().includes("example.com"));
  const login = (needsEmail ? "" : userProfile?.email) || userProfile?.phoneNUmber || "";

  return (
    <div ref={boxRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("userMenu")}
        className={`${BAR_BUTTON} relative inline-flex h-9 gap-2 px-1.5 pointer-coarse:h-11`}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
          {initials || <User className="size-4" aria-hidden />}
        </span>
        {name && <span className="hidden max-w-40 truncate text-sm font-medium lg:inline">{name}</span>}
        {needsEmail && (
          <span className="absolute top-1 left-6 size-2 rounded-full bg-amber-400" aria-hidden />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-float-2">
          {(name || login) && (
            <div className="border-b px-2.5 pt-1.5 pb-2.5">
              {name && <p className="truncate text-sm font-medium">{name}</p>}
              {login && <p className="truncate text-xs text-muted-foreground">{login}</p>}
            </div>
          )}
          <div className="pt-1.5">
            <Link href="/profile" onClick={() => setOpen(false)} className={MENU_ITEM}>
              <User className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{t("profile")}</span>
              {needsEmail && <span className="size-2 rounded-full bg-amber-500" aria-hidden />}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setHelpOpen(true);
              }}
              className={`${MENU_ITEM} hidden md:flex`}
            >
              <Keyboard className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{t("keyboardShortcuts")}</span>
            </button>
            <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className={MENU_ITEM}>
              {dark ? <Sun className="size-4 shrink-0" aria-hidden /> : <Moon className="size-4 shrink-0" aria-hidden />}
              <span className="flex-1 truncate">{dark ? t("themeLight") : t("themeDark")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetTextTranslation();
                resetDocumentTranslation();
                signOutEverywhere(locale);
              }}
              className={MENU_ITEM}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
