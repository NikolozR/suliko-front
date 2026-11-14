"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { UserProfile } from "@/features/auth/types/types.User";
import { HistoryDropdown } from "@/features/chatHistory/components/HistoryDropdown";
import { SidebarLanguageSelector } from "./SidebarLanguageSelector";
import {
  Plus,
  FolderOpen,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import { SidebarBalanceCard } from "./SidebarBalanceCard";
import { KbdCombo } from "@/shared/components/Kbd";
import { GO_TARGETS } from "@/shared/shortcuts/definitions";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsProvider";
import { useLocale, useTranslations } from "next-intl";
import { OFFICE_URL, officeLocale } from "@/features/sulikoOffice/lib/officeLinks";

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
      {/* The same frame as Suliko Office's sidebar: under the 56px top bar,
          4rem collapsed, 14rem at md, 16rem at lg. The mark, the switch that
          folds it and the product switch are in the top bar (shell/Topbar). */}
      <aside
        className={`sidebar-main hidden md:flex flex-col fixed inset-y-0 left-0 z-40 overflow-hidden border-r pt-14 print:hidden ${effectiveIsCollapsed
          ? "w-16"
          : "w-56 lg:w-64"
          }`}
      >
        <nav className="custom_scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
          {visibleNavItems.map(({ label, href, icon: Icon, disabled }) => (
            disabled ? (
              <span
                key={href}
                className={`sidebar-item-disabled group text-sm font-medium flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 opacity-50 cursor-not-allowed select-none ${effectiveIsCollapsed ? "justify-center px-0" : ""}`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <Icon className="size-4 shrink-0" />
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
                  ? `group text-sm font-medium flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 transition-all suliko-default-bg text-primary-foreground dark:text-white font-semibold hover:opacity-90 shadow-sm ${effectiveIsCollapsed ? "justify-center px-0" : ""}`
                  : `sidebar-item group text-sm font-medium flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 transition-colors ${isActive(href)
                    ? "sidebar-item-active font-medium"
                    : ""
                  } ${effectiveIsCollapsed ? "justify-center px-0" : ""}`
                }
                aria-current={isActive(href) ? "page" : undefined}
                title={effectiveIsCollapsed ? hintTitle(t(label), href) : undefined}
              >
                <div className="relative flex items-center">
                  <Icon
                    className="size-4 shrink-0"
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
                  className={`sidebar-item group flex-1 min-w-0 text-sm font-medium flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 transition-colors ${pathname === "/projects" || pathname?.startsWith("/projects/") || pathname?.startsWith("/translations/")
                    ? "sidebar-item-active font-medium"
                    : ""
                    } ${effectiveIsCollapsed ? "justify-center px-0" : ""}`}
                  aria-current={pathname === "/projects" || pathname?.startsWith("/projects/") || pathname?.startsWith("/translations/") ? "page" : undefined}
                  title={effectiveIsCollapsed ? t("projects") : undefined}
                >
                  <FolderOpen className="size-4 shrink-0" />
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

        {/* The foot, as in Office: this product's meter (the page balance, where
            Office shows the month's orders) and the way to the other product.
            Profile, the shortcuts and Sign out are in the top bar's user menu. */}
        {token && (
          <div className="shrink-0 space-y-1 border-t border-sidebar-border px-2 py-3">
            {userProfile && <SidebarBalanceCard profile={userProfile} collapsed={effectiveIsCollapsed} />}
            <a
              href={officeHref}
              title={effectiveIsCollapsed ? t("office") : undefined}
              aria-label={effectiveIsCollapsed ? t("office") : undefined}
              className={`sidebar-item group flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 text-sm font-medium transition-colors ${effectiveIsCollapsed ? "justify-center px-0" : ""}`}
            >
              <Briefcase className="size-4 shrink-0" aria-hidden />
              {!effectiveIsCollapsed && <span className="truncate">{t("office")}</span>}
            </a>
          </div>
        )}
      </aside>
    </>
  );
} 