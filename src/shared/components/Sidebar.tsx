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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
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
    // Show overlay on mobile when sidebar is expanded
    if (!effectiveIsCollapsed && isMobile) {
      return (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300" 
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
        className={`sidebar-main flex flex-col h-screen fixed left-0 top-0 z-40 border-r transition-all duration-300 ${
          effectiveIsCollapsed 
            ? "w-16" 
            : "w-48 md:w-56 lg:w-64"
        } ${
          !effectiveIsCollapsed 
            ? "md:shadow-none shadow-2xl" 
            : "md:shadow-none"
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
                className={`sidebar-item group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  isActive(href)
                    ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                    : ""
                } ${effectiveIsCollapsed ? "justify-center" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <div className="relative flex items-center">
                  <Icon
                    className={`transition-transform duration-200 ${
                      effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
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
            <div className="relative">
              <button
                onClick={() => {
                  // If sidebar is collapsed, expand it first and open history
                  if (effectiveIsCollapsed) {
                    storeSetIsCollapsed(false);
                    // Use setTimeout to ensure sidebar expands before opening dropdown
                    setTimeout(() => {
                      setIsHistoryOpen(true);
                    }, 100);
                  } else {
                    // If sidebar is already expanded, just toggle history dropdown
                    setIsHistoryOpen(!isHistoryOpen);
                  }
                }}
                className={`sidebar-item group w-full text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${effectiveIsCollapsed ? "justify-center" : "justify-between"}`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`transition-transform duration-200 ${
                    effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-105`} />
                  {!effectiveIsCollapsed && (
                    <span className="whitespace-nowrap">{t("history")}</span>
                  )}
                </div>
                {!effectiveIsCollapsed && (
                  isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <HistoryDropdown isCollapsed={effectiveIsCollapsed} isOpen={isHistoryOpen} />
            </div>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2 p-3">
          {token ? (
            <>
              {userProfile && (
                <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2 ${
                  effectiveIsCollapsed ? "justify-center" : ""
                }`}>
                  <Link href='/price'>
                  <Wallet className="h-5 w-5 cursor-pointer text-green-600 flex-shrink-0" />
                  </Link>
                  {!effectiveIsCollapsed && (
                    <Link href="/price" className="flex flex-col min-w-0 hover:opacity-80 transition-opacity">
                      <span className="text-xs text-muted-foreground">{t('balance')}</span>
                      <span className="font-semibold text-green-600">
                        {formatBalance(userProfile.balance || 0)} {t('pages')}
                      </span>
                    </Link>
                  )}
                </div>
              )}
              <Button
                className={`w-full flex items-center gap-3 dark:text-white suliko-default-bg text-primary-foreground hover:opacity-90 transition-all py-2.5 rounded group ${
                  effectiveIsCollapsed ? "justify-center px-0" : "justify-start px-3"
                }`}
                onClick={() => {
                  reset();
                  resetTextTranslation();
                  resetDocumentTranslation();
                  router.push("/sign-in");
                }}
              >
                <LogOut
                  className={`transition-transform duration-200 ${
                    effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
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
              className={`sidebar-item group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                effectiveIsCollapsed ? "justify-center" : ""
              }`}
            >
              <User
                className={`transition-transform duration-200 ${
                  effectiveIsCollapsed ? "h-5 w-5" : "h-5 w-5"
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