"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Plus, FolderOpen, HelpCircle, User } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslations } from "next-intl";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { token } = useAuthStore();
  const t = useTranslations("Sidebar");
  const resetTextTranslation = useTextTranslationStore((s) => s.reset);
  const resetDocumentTranslation = useDocumentTranslationStore((s) => s.reset);

  const isActive = (href: string) => {
    const segments = pathname.split("/").slice(2).join("/");
    return `/${segments}`.startsWith(href);
  };

  const navItems = [
    {
      label: t("newProject"),
      href: "/text" as const,
      icon: Plus,
      onClick: () => {
        resetTextTranslation();
        resetDocumentTranslation();
      },
    },
    ...(token
      ? [{ label: t("projects"), href: "/projects" as const, icon: FolderOpen }]
      : []),
    { label: t("help"), href: "/help" as const, icon: HelpCircle },
    token
      ? { label: t("profile"), href: "/profile" as const, icon: User }
      : { label: t("login"), href: "/sign-in" as const, icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ label, href, icon: Icon, ...rest }) => {
          const active = isActive(href);
          const onClick = "onClick" in rest ? rest.onClick : undefined;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClick}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                active
                  ? "text-suliko-default-color font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-suliko-default-color" : ""}`} />
              <span className="truncate max-w-[64px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
