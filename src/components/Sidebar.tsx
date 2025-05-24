"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  Plus,
  Clock,
  HelpCircle,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import SulikoLogo from "./SulikoLogo";

const NAV_ITEMS = [
  {
    label: "New Project",
    href: "/",
    icon: Plus,
  },
  {
    label: "History",
    href: "/history",
    icon: Clock,
  },
  {
    label: "Help",
    href: "/help",
    icon: HelpCircle,
  },
  {
    label: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { token, setToken, setRefreshToken } = useAuthStore();
  const { isCollapsed, setIsCollapsed } = useSidebarStore();
  const router = useRouter();

  // Auto-collapse on mobile and handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setIsCollapsed(true);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Backdrop overlay for mobile when expanded */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <aside
        className={`flex flex-col h-screen fixed left-0 top-0 z-40 bg-background border-r transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-48 md:w-56 lg:w-64"
        } ${!isCollapsed ? "md:shadow-none shadow-2xl" : ""}`}
      >
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 mb-6`}>
          {!isCollapsed && (
            <SulikoLogo className="transition-all duration-300" />
          )}
          <button
            onClick={handleCollapse}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`group text-xs sm:text-sm lg:text-base flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                isActive(href)
                  ? "suliko-default-bg text-primary-foreground font-medium dark:text-white"
                  : "hover:bg-accent hover:text-accent-foreground"
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
                  {label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 p-3">
          {token ? (
            <>
              <Link
                href="/profile"
                className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  isActive("/profile")
                    ? "suliko-default-bg text-primary-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <User
                  className={`transition-transform duration-200 ${
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-105`}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    Profile
                  </span>
                )}
              </Link>
              <Button
                className={`w-full flex items-center gap-3 dark:text-white suliko-default-bg text-primary-foreground hover:opacity-90 transition-all py-2.5 rounded group ${
                  isCollapsed ? "justify-center px-0" : "justify-start px-3"
                }`}
                onClick={() => {
                  setToken(null);
                  setRefreshToken(null);
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
                    Sign Out
                  </span>
                )}
              </Button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent hover:text-accent-foreground ${
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
                  Sign Up
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