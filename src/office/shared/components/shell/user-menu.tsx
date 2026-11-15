"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CircleUser, LogOut, Monitor, Moon, RotateCcw, Sparkles, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { useTips } from "@office/features/onboarding-tips/tips-provider";
import { Link } from "@office/i18n/navigation";
import { routing, type Locale } from "@office/i18n/routing";
import { useLocaleSwitch } from "@office/shared/components/shell/use-locale-switch";
import { cn } from "@office/shared/lib/utils";
import { logoutAction } from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { forgetRecentOrders } from "@office/shared/lib/recent-orders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@office/shared/components/ui/dropdown-menu";

/** Up to two letters: the first of the first two words, else of the login. */
function initials(name: string, login: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0]).join("");
  return (letters || Array.from(login)[0] || "?").toUpperCase();
}

const LOCALE_LABELS: Record<Locale, string> = { ka: "ქართული", en: "English" };

/** A small segmented control: one row of a label and its choices. */
function PreferenceRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="bg-muted flex rounded-md p-0.5 text-xs"
      >
        {children}
      </div>
    </div>
  );
}

function Choice({
  active,
  label,
  onSelect,
  children,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={cn(
        "flex h-6 items-center justify-center rounded px-2 font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Who is signed in, and the two things to do about it: open the account
 * screen, or sign out.
 *
 * The sign-out form sits outside the menu, which renders in a portal, and
 * the item submits it. A form inside the menu would be unmounted as the
 * menu closes, possibly before the submit lands.
 */
export function UserMenu({ name, login }: { name: string; login: string }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const logoutForm = useRef<HTMLFormElement>(null);
  const tips = useTips();
  const tTips = useTranslations("tips");
  const { locale: current, switchTo, isPending } = useLocaleSwitch();
  const { theme, setTheme } = useTheme();
  // The stored theme is unknown until hydration; showing a choice before then
  // would flash the wrong one.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <form ref={logoutForm} action={logoutAction} className="hidden">
        <input type="hidden" name="locale" value={locale} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("account")}
            className="gap-2 px-1.5 text-white hover:bg-white/15 hover:text-white"
          >
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold"
            >
              {initials(name, login)}
            </span>
            <span className="hidden max-w-40 truncate lg:inline">{name || login}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{name || login}</p>
            {name && login && (
              <p className="text-muted-foreground truncate text-xs">{login}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">
              <CircleUser className="size-4" />
              {t("account")}
            </Link>
          </DropdownMenuItem>
          {tips.enabled && (
            <>
              <DropdownMenuItem onSelect={tips.startTour}>
                <Sparkles className="size-4" />
                {tTips("startTour")}
              </DropdownMenuItem>
              {tips.anySeen && (
                <DropdownMenuItem onSelect={tips.replay}>
                  <RotateCcw className="size-4" />
                  {tTips("replay")}
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuSeparator />
          <PreferenceRow label={t("languageLabel")}>
            {routing.locales.map((l) => (
              <Choice
                key={l}
                active={l === current}
                label={LOCALE_LABELS[l]}
                onSelect={() => !isPending && switchTo(l)}
              >
                {l.toUpperCase()}
              </Choice>
            ))}
          </PreferenceRow>
          <PreferenceRow label={t("themeLabel")}>
            {(
              [
                ["light", Sun],
                ["dark", Moon],
                ["system", Monitor],
              ] as const
            ).map(([value, Icon]) => (
              <Choice
                key={value}
                active={mounted && theme === value}
                label={t(`theme.${value}`)}
                onSelect={() => setTheme(value)}
              >
                <Icon className="size-3.5" aria-hidden />
              </Choice>
            ))}
          </PreferenceRow>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              // They carry client names; the next person at this browser
              // should not find them in the quick search.
              forgetRecentOrders();
              logoutForm.current?.requestSubmit();
            }}
          >
            <LogOut className="size-4" />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
