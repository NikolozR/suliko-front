"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import { Button } from "@/features/ui/components/ui/button";
import { ThemeToggle } from "@/features/ui/components/ThemeToggle";
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
} from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import SulikoLogo from "./SulikoLogo";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  {
    label: "newProject",
    href: "/",
    icon: Plus,
  },
  {
    label: "history",
    href: "/history",
    icon: Clock,
    disabled: true,
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
    disabled: true,
  },
  {
    label: "feedback",
    href: "/feedback",
    icon: MessageSquare,
    disabled: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { token, reset } = useAuthStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const { reset: resetTextTranslation } = useTextTranslationStore();
  const { reset: resetDocumentTranslation } = useDocumentTranslationStore();
  const { isCollapsed, setIsCollapsed } = useSidebarStore();
  const router = useRouter();
  const t = useTranslations('Sidebar');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  useEffect(() => {
    if (token && !userProfile) {
      fetchUserProfile();
    }
  }, [token, userProfile, fetchUserProfile]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href: string) => pathname === href;

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.requiresAuth) {
      return !!token;
    }
    return true;
  });

  return (
    <>
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <aside
        className={`sidebar-main flex flex-col h-screen fixed left-0 top-0 z-40 border-r transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-48 md:w-56 lg:w-64"
        } ${!isCollapsed ? "md:shadow-none shadow-2xl" : ""}`}
      >
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 mb-6`}>
          {!isCollapsed && (
            <SulikoLogo className="transition-all duration-300" />
          )}
          <button
            onClick={handleCollapse}
            className="sidebar-button flex-shrink-0 p-1.5 rounded-lg cursor-pointer transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {visibleNavItems.map(({ label, href, icon: Icon, disabled }) => (
            disabled ? (
              <span
                key={href}
                className={`sidebar-item-disabled group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 opacity-50 cursor-not-allowed select-none ${isCollapsed ? "justify-center" : ""}`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <Icon className={`transition-transform duration-200 ${isCollapsed ? "h-5 w-5" : "h-5 w-5"}`} />
                {!isCollapsed && (
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
                } ${isCollapsed ? "justify-center" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon
                  className={`transition-transform duration-200 ${
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-105`}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    {t(label)}
                  </span>
                )}
              </Link>
            )
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 p-3">
          {token ? (
            <>
              {userProfile && (
                <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2 ${
                  isCollapsed ? "justify-center" : ""
                }`}>
                  <Wallet className="h-5 w-5 text-green-600 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground">{t('balance')}</span>
                      <span className="font-semibold text-green-600">
                        ₾{userProfile.balance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <Button
                className={`w-full flex items-center gap-3 dark:text-white suliko-default-bg text-primary-foreground hover:opacity-90 transition-all py-2.5 rounded group ${
                  isCollapsed ? "justify-center px-0" : "justify-start px-3"
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
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-105`}
                />
                {!isCollapsed && (
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
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <User
                className={`transition-transform duration-200 ${
                  isCollapsed ? "h-5 w-5" : "h-5 w-5"
                } group-hover:scale-105`}
              />
              {!isCollapsed && (
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