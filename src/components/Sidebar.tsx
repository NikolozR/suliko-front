"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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
import SulikoLogoBlack from "../../public/Suliko_logo_black.svg";
import SulikoLogoWhite from "../../public/suliko_logo_white.svg";

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

export default function Sidebar({ onCollapse }: { onCollapse: (collapsed: boolean) => void }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const { token, setToken, setRefreshToken } = useAuthStore();
  const router = useRouter();

  const handleCollapse = () => {
    onCollapse(!isCollapsed);
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={`flex flex-col h-screen fixed left-0 top-0 z-40 bg-background border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 mb-6`}>
        {!isCollapsed && (
          <Image
            src={theme === "dark" ? SulikoLogoWhite : SulikoLogoBlack}
            width={120}
            height={30}
            alt="Suliko Logo"
            className="transition-all duration-300"
          />
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
            className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
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
                router.push("/sign-up");
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
            href="/sign-up"
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
  );
} 