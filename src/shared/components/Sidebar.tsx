"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useUser } from "@/features/auth/hooks/useUser";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { ThemeToggle } from "@/features/ui/components/ThemeToggle";
import { UserProfile } from "@/features/auth/types/types.User";
import { HistoryDropdown } from "@/features/chatHistory/components/HistoryDropdown";
import { SidebarLanguageSelector } from "./SidebarLanguageSelector";
import {
  Plus,
  FolderOpen,
  HelpCircle,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  ExternalLink,
  ClipboardList,
  Keyboard,
} from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import SulikoLogo from "./SulikoLogo";
import { SidebarBalanceCard } from "./SidebarBalanceCard";
import { KbdCombo } from "@/shared/components/Kbd";
import { GO_TARGETS } from "@/shared/shortcuts/definitions";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsProvider";
import { useLocale, useTranslations } from "next-intl";
import { OFFICE_URL, officeLocale } from "@/features/sulikoOffice/lib/officeLinks";
import { signOutEverywhere } from "@/features/auth/services/signOut";

const NAV_ITEMS = [
  {
    label: "newTranslation",
    href: "/text",
    icon: Plus,
  },
  {
    label: "passport",
    href: "/passport",
    icon: FileText,
    requiresAuth: true,
  },
  {
    // What bureaus have assigned to this person. Always there for someone
    // signed in: the page itself says so when no bureau has added them yet.
    label: "orders",
    href: "/orders",
    icon: ClipboardList,
    requiresAuth: true,
  },
  // Help, Feedback and the language are on the Profile page for someone
  // signed in (`ProfileLanguageAndHelp`). A visitor has no profile, so they
  // stay here.
  {
    label: "help",
    href: "/help",
    icon: HelpCircle,
    disabled: false,
    signedOutOnly: true,
  },
  {
    label: "feedback",
    href: "/feedback",
    icon: MessageSquare,
    disabled: false,
    signedOutOnly: true,
  },
];

/**
 * The Alt+digit hint of a sidebar link: shown on hover and focus, and on every
 * link at once while Alt is held, so the digits can be read off the sidebar.
 * Not when collapsed, where the link's title carries it.
 */
function ShortcutHint({ href }: { href: string }) {
  const { altHeld } = useShortcuts();
  const target = GO_TARGETS.find((entry) => entry.href === href);
  if (!target) return null;
  return (
    <KbdCombo
      keys={["Alt", target.digit]}
      className={`ml-auto hidden shrink-0 transition-opacity md:inline-flex ${
        altHeld ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
      }`}
    />
  );
}

/** "Passport (Alt 3)" for a link that has a digit, else just the name. */
function hintTitle(name: string, href: string): string {
  const target = GO_TARGETS.find((entry) => entry.href === href);
  return target ? `${name} (Alt ${target.digit})` : name;
}

interface SidebarProps {
  initialUserProfile?: UserProfile | null;
}

export default function Sidebar({ initialUserProfile }: SidebarProps) {
  const pathname = usePathname();
  const { token } = useAuthStore();
  const { userProfile, setUserProfile } = useUserStore();
  const { initials } = useUser();
  const { reset: resetTextTranslation } = useTextTranslationStore();
  const { reset: resetDocumentTranslation } = useDocumentTranslationStore();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const storeIsCollapsed = useSidebarStore((state) => state.isCollapsed!);
  const storeSetIsCollapsed = useSidebarStore((state) => state.setIsCollapsed);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const t = useTranslations('Sidebar');
  const locale = useLocale();
  const { setHelpOpen } = useShortcuts();

  // Until the browser has read its own token, go by what the server saw: the
  // profile it fetched with the token cookie. Otherwise every page load would
  // paint the visitor's links first and then swap them.
  const signedIn = Boolean(token) || (!isClient && Boolean(initialUserProfile));

  // Hydrate userStore with server-fetched data
  useEffect(() => {
    if (initialUserProfile && !userProfile) {
      setUserProfile(initialUserProfile);
    }
  }, [initialUserProfile, userProfile, setUserProfile]);

  const handleCollapseToggle = () => {
    storeSetIsCollapsed(!storeIsCollapsed);
  };

  useEffect(() => {
    if (isMobile) {
      storeSetIsCollapsed(true);
    }
  }, [isMobile, storeSetIsCollapsed]);

  const isActive = (href: string) => {
    if (href === '/text') {
      return pathname === '/text' || pathname === '/document';
    }
    if (href === '/orders') {
      return pathname === '/orders' || pathname.startsWith('/orders/');
    }
    return pathname === href;
  };

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.signedOutOnly) {
      return !signedIn;
    }
    if (item.requiresAuth) {
      return signedIn;
    }
    return true;
  });

  // Determine effective collapsed state for rendering to prevent hydration mismatch
  // On screens < 680px, always treat as collapsed regardless of stored preference
  const effectiveIsCollapsed = !isClient ? false : (isMobile || storeIsCollapsed);

  const officeHref = `${OFFICE_URL}/${officeLocale(locale)}/dashboard`;

  const needsEmailReminder = Boolean(
    userProfile?.email && userProfile.email.toLowerCase().includes("example.com")
  );

  // const renderOverlay = () => {
  //   if (isMobile) {
  //     return (
  //       <div
  //         className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${!effectiveIsCollapsed
  //             ? "bg-black/40 backdrop-blur-[2px] opacity-100 pointer-events-auto"
  //             : "bg-transparent opacity-0 pointer-events-none"
  //           }`}
  //         onClick={() => storeSetIsCollapsed(true)}
  //         aria-hidden="true"
  //       />
  //     );
  //   }
  //   return null;
  // };

  return (
    <>
      {/* {renderOverlay()} */}
      <aside
        className={`sidebar-main hidden md:flex flex-col h-[100dvh] overflow-hidden fixed left-0 top-0 z-40 border-r transition-all duration-300 ease-in-out ${effectiveIsCollapsed
          ? "w-20"
          : "w-48 md:w-56 lg:w-64"
          } ${!effectiveIsCollapsed
            ? "md:shadow-none shadow-float-3"
            : "md:shadow-none"
          }`}
      >
        <div className={`flex items-center h-20 shrink-0 ${effectiveIsCollapsed ? "justify-center" : "justify-between"} px-4`}>
          {!effectiveIsCollapsed && (
            <Link
              href="/translate"
              className="flex items-center transition-all duration-300 cursor-pointer"
              aria-label="Go to landing page"
            >
              <SulikoLogo />
            </Link>
          )}
          <button
            onClick={handleCollapseToggle}
            className={`sidebar-button shrink-0 items-center justify-center h-9 w-9 rounded-lg cursor-pointer transition-colors ${isMobile ? "hidden" : "flex"}`}
            aria-label={effectiveIsCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveIsCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {token && (
          <div className="shrink-0 px-2 pb-1">
            {effectiveIsCollapsed ? (
              <a
                href={officeHref}
                title={t("office")}
                aria-label={t("office")}
                className="sidebar-item group flex items-center justify-center rounded-md px-3 py-2.5 transition-colors"
              >
                <Briefcase className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
              </a>
            ) : (
              <div role="group" aria-label={t("products")} className="flex gap-1 rounded-lg bg-muted/60 p-1 text-sm">
                <span aria-current="true" className="flex-1 rounded-md bg-background px-2 py-1 text-center font-medium shadow-sm">
                  {t("translate")}
                </span>
                <a
                  href={officeHref}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("office")}
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                </a>
              </div>
            )}
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pt-1 space-y-1">
          {visibleNavItems.map(({ label, href, icon: Icon, disabled }) => (
            disabled ? (
              <span
                key={href}
                className={`sidebar-item-disabled group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 opacity-50 cursor-not-allowed select-none ${effectiveIsCollapsed ? "justify-center" : ""}`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <Icon className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"}`} />
                {!effectiveIsCollapsed && (
                  <span className="whitespace-nowrap">{t(label)}</span>
                )}
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                onClick={label === "newTranslation" ? () => {
                  resetTextTranslation();
                  resetDocumentTranslation();
                } : undefined}
                className={label === "newTranslation"
                  ? `group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-all suliko-default-bg text-primary-foreground dark:text-white font-semibold hover:opacity-90 shadow-sm ${effectiveIsCollapsed ? "justify-center" : ""}`
                  : `sidebar-item group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${isActive(href)
                    ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                    : ""
                  } ${effectiveIsCollapsed ? "justify-center" : ""}`
                }
                aria-current={isActive(href) ? "page" : undefined}
                title={effectiveIsCollapsed ? hintTitle(t(label), href) : undefined}
              >
                <div className="relative flex items-center">
                  <Icon
                    className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                      } group-hover:scale-105`}
                  />
                </div>
                {!effectiveIsCollapsed && (
                  <>
                    <span className="whitespace-nowrap">
                      {t(label)}
                    </span>
                    <ShortcutHint href={href} />
                  </>
                )}
              </Link>
            )
          ))}

          {!signedIn && (
            <div className="w-full">
              <SidebarLanguageSelector isCollapsed={effectiveIsCollapsed} />
            </div>
          )}

          {token && (
            <div className="relative space-y-1">
              <div className="flex items-center">
                <Link
                  href="/projects"
                  className={`sidebar-item group flex-1 min-w-0 text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${pathname === "/projects" || pathname?.startsWith("/projects/") || pathname?.startsWith("/translations/")
                    ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                    : ""
                    } ${effectiveIsCollapsed ? "justify-center" : ""}`}
                  aria-current={pathname === "/projects" || pathname?.startsWith("/projects/") || pathname?.startsWith("/translations/") ? "page" : undefined}
                  title={effectiveIsCollapsed ? t("projects") : undefined}
                >
                  <FolderOpen className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                  {!effectiveIsCollapsed && (
                    <>
                      <span className="whitespace-nowrap truncate">{t("projects")}</span>
                      <ShortcutHint href="/projects" />
                    </>
                  )}
                </Link>
                {!effectiveIsCollapsed && (
                  <button
                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    className="sidebar-item p-2 rounded-md transition-colors shrink-0"
                    aria-label={isProjectsOpen ? "Collapse projects list" : "Expand projects list"}
                  >
                    {isProjectsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <HistoryDropdown isCollapsed={effectiveIsCollapsed} isOpen={isProjectsOpen} />
            </div>
          )}

        </nav>

        <div className="shrink-0 flex flex-col gap-2 border-t border-sidebar-border p-3">
          {token ? (
            <>
              {userProfile && <SidebarBalanceCard profile={userProfile} collapsed={effectiveIsCollapsed} />}
              <div className={`flex gap-1 ${effectiveIsCollapsed ? "flex-col items-center" : "items-center"}`}>
                <Link
                  href="/profile"
                  aria-label={t("profile")}
                  title={effectiveIsCollapsed ? t("profile") : undefined}
                  aria-current={pathname === "/profile" ? "page" : undefined}
                  className={`group relative flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors text-sm ${pathname === "/profile" ? "suliko-default-bg text-primary-foreground font-medium dark:text-white" : "sidebar-item"} ${effectiveIsCollapsed ? "justify-center" : "flex-1"}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initials || <User className="h-4 w-4" />}
                  </span>
                  {needsEmailReminder && (
                    <span className="absolute top-1 left-7 h-2 w-2 rounded-full bg-amber-500 animate-flicker" />
                  )}
                  {!effectiveIsCollapsed && <span className="truncate">{t("profile")}</span>}
                </Link>
                {!effectiveIsCollapsed && (
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    title={`${t("keyboardShortcuts")} (?)`}
                    aria-label={t("keyboardShortcuts")}
                    className="sidebar-button hidden h-8 w-8 shrink-0 items-center justify-center rounded-md cursor-pointer transition-colors md:flex"
                  >
                    <Keyboard className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  title={t("logout")}
                  aria-label={t("logout")}
                  className="sidebar-button flex h-8 w-8 shrink-0 items-center justify-center rounded-md cursor-pointer transition-colors"
                  onClick={() => {
                    resetTextTranslation();
                    resetDocumentTranslation();
                    signOutEverywhere(locale);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className={`flex gap-2 ${effectiveIsCollapsed ? "flex-col items-center" : "items-center"}`}>
              <Link
                href="/sign-in"
                className={`sidebar-item group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${effectiveIsCollapsed ? "justify-center" : "flex-1"}`}
              >
                <User className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                {!effectiveIsCollapsed && <span className="whitespace-nowrap">{t("login")}</span>}
              </Link>
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>
    </>
  );
} 