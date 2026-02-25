"use client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { Button } from "@/features/ui/components/ui/button";
import { ThemeToggle } from "@/features/ui/components/ThemeToggle";
import { UserProfile } from "@/features/auth/types/types.User";
import { HistoryDropdown } from "@/features/chatHistory/components/HistoryDropdown";
import { SidebarLanguageSelector } from "./SidebarLanguageSelector";
import { formatBalance } from "@/shared/utils/domainUtils";
import {
  Plus,
  PlusCircle,
  Clock,
  HelpCircle,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import SulikoLogo from "./SulikoLogo";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  {
    label: "newProject",
    href: "/text",
    icon: Plus,
  },
  {
    label: "profile",
    href: "/profile",
    icon: User,
    requiresAuth: true,
  },
  {
    label: "help",
    href: "/help",
    icon: HelpCircle,
    disabled: false,
  },
  {
    label: "feedback",
    href: "/feedback",
    icon: MessageSquare,
    disabled: false,
  },
];

interface SidebarProps {
  initialUserProfile?: UserProfile | null;
}

export default function Sidebar({ initialUserProfile }: SidebarProps) {
  const pathname = usePathname();
  const { token, reset } = useAuthStore();
  const { userProfile, setUserProfile } = useUserStore();
  const { reset: resetTextTranslation } = useTextTranslationStore();
  const { reset: resetDocumentTranslation } = useDocumentTranslationStore();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const storeIsCollapsed = useSidebarStore((state) => state.isCollapsed);
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

  const router = useRouter();
  const t = useTranslations('Sidebar');

  // Hydrate userStore with server-fetched data
  useEffect(() => {
    if (initialUserProfile && !userProfile) {
      setUserProfile(initialUserProfile);
    }
  }, [initialUserProfile, userProfile, setUserProfile]);

  // Handle responsive behavior - don't force collapse on mobile, allow user to toggle
  useEffect(() => {
    if (!isClient) return;
    setIsMobile(window.innerWidth < 768);
  }, [isClient]);

  const handleCollapseToggle = () => {
    storeSetIsCollapsed(!storeIsCollapsed);
  };

  const isActive = (href: string) => {
    if (href === '/text') {
      return pathname === '/text' || pathname === '/document';
    }
    return pathname === href;
  };

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.requiresAuth) {
      return !!token;
    }
    return true;
  });

  // Determine effective collapsed state for rendering to prevent hydration mismatch
  const effectiveIsCollapsed = !isClient ? false : storeIsCollapsed;

  const needsEmailReminder = Boolean(
    userProfile?.email && userProfile.email.toLowerCase().includes("example.com")
  );

  const renderOverlay = () => {
    if (isMobile) {
      return (
        <div
          className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${!effectiveIsCollapsed
              ? "bg-black/40 backdrop-blur-[2px] opacity-100 pointer-events-auto"
              : "bg-transparent opacity-0 pointer-events-none"
            }`}
          onClick={() => storeSetIsCollapsed(true)}
          aria-hidden="true"
        />
      );
    }
    return null;
  };

  return (
    <>
      {renderOverlay()}
      <aside
        className={`sidebar-main flex flex-col h-screen overflow-auto fixed left-0 top-0 z-40 border-r transition-all duration-300 ease-in-out ${effectiveIsCollapsed
            ? "w-16"
            : "w-48 md:w-56 lg:w-64"
          } ${!effectiveIsCollapsed
            ? "md:shadow-none shadow-xl"
            : "md:shadow-none"
          } ${isMobile && effectiveIsCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          }`}
      >
        <div className={`flex items-center ${effectiveIsCollapsed ? "justify-center" : "justify-between"} p-4 mb-6`}>
          {!effectiveIsCollapsed && (
            <Link
              href="/"
              className="transition-all duration-300 cursor-pointer"
              aria-label="Go to landing page"
            >
              <SulikoLogo />
            </Link>
          )}
          <button
            onClick={handleCollapseToggle}
            className="sidebar-button flex-shrink-0 p-1.5 rounded-lg cursor-pointer transition-colors"
            aria-label={effectiveIsCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveIsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
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
                onClick={label === "newProject" ? () => {
                  resetTextTranslation();
                  resetDocumentTranslation();
                } : undefined}
                className={`sidebar-item group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${isActive(href)
                    ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                    : ""
                  } ${effectiveIsCollapsed ? "justify-center" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <div className="relative flex items-center">
                  <Icon
                    className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                      } group-hover:scale-105`}
                  />
                  {needsEmailReminder && label === "profile" && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(24,28,42,1)] animate-flicker" />
                  )}
                </div>
                {!effectiveIsCollapsed && (
                  <>
                    <span className="whitespace-nowrap">
                      {t(label)}
                    </span>
                    {needsEmailReminder && label === "profile" && (
                      <span className="ml-auto text-[11px] font-medium text-amber-700 bg-amber-100 py-0.5 px-2 rounded-full flex-shrink-0 animate-flicker">
                        {t("completeEmail")}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          ))}

          <div className="w-full">
            <SidebarLanguageSelector isCollapsed={effectiveIsCollapsed} />
          </div>

          {token && (
            <div className="relative space-y-1">
              <div className="flex items-center">
                <Link
                  href="/projects"
                  className={`sidebar-item group flex-1 min-w-0 text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${pathname === "/projects" || pathname?.startsWith("/projects/")
                      ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                      : ""
                    } ${effectiveIsCollapsed ? "justify-center" : ""}`}
                  aria-current={pathname === "/projects" || pathname?.startsWith("/projects/") ? "page" : undefined}
                >
                  <Clock className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                    } group-hover:scale-105`} />
                  {!effectiveIsCollapsed && (
                    <span className="whitespace-nowrap truncate">{t("projects")}</span>
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

        <div className="mt-auto flex flex-col gap-2 p-3">
          {token ? (
            <>
              {userProfile && (
                <div className={`flex items-center gap-3 p-3 rounded-lg mb-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 ${effectiveIsCollapsed ? "justify-center" : ""
                  }`}>
                  <Link href='/price'>
                    <Wallet className="h-5 w-5 cursor-pointer text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  </Link>
                  {!effectiveIsCollapsed && (
                    <Link href="/price" className="flex flex-col min-w-0 w-full hover:opacity-80 transition-opacity">
                      <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70">{t('balance')}</span>
                      <span className="font-semibold flex items-center w-full justify-between  text-emerald-700 dark:text-emerald-300">
                        {formatBalance(userProfile.balance || 0)} {t('pages')}
                        <PlusCircle
                          className={`transition-transform duration-200 h-5 w-5 group-hover:scale-105`}
                        />
                      </span>
                    </Link>
                  )}
                </div>
              )}
              {/* <Link href="/price" className="block">
                <Button
                  variant="outline"
                  className={`w-full flex items-center gap-3 text-white bg-emerald-600 hover:bg-emerald-700 border-0 py-2.5 rounded transition-all group ${
                    effectiveIsCollapsed ? "justify-center px-0" : "justify-start px-3"
                  }`}
                >
                  <PlusCircle
                    className={`transition-transform duration-200 h-5 w-5 group-hover:scale-105`}
                  />
                  {!effectiveIsCollapsed && (
                    <span className="whitespace-nowrap">
                      {t('fillBalance')}
                    </span>
                  )}
                </Button>
              </Link> */}
              <Button
                className={`w-full flex items-center gap-3 dark:text-white suliko-default-bg text-primary-foreground hover:opacity-90 transition-all py-2.5 rounded group ${effectiveIsCollapsed ? "justify-center px-0" : "justify-start px-3"
                  }`}
                onClick={() => {
                  reset();
                  resetTextTranslation();
                  resetDocumentTranslation();
                  router.push("/sign-in");
                }}
              >
                <LogOut
                  className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                    } group-hover:scale-105`}
                />
                {!effectiveIsCollapsed && (
                  <span className="whitespace-nowrap">
                    {t('logout')}
                  </span>
                )}
              </Button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className={`sidebar-item group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${effectiveIsCollapsed ? "justify-center" : ""
                }`}
            >
              <User
                className={`transition-transform duration-200 ${effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-105`}
              />
              {!effectiveIsCollapsed && (
                <span className="whitespace-nowrap">
                  {t('login')}
                </span>
              )}
            </Link>
          )}
          <div className="mt-3 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
} 