"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Plus, FolderOpen, HelpCircle, User, ClipboardList } from "lucide-react";
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
      label: t("newTranslation"),
      href: "/text" as const,
      icon: Plus,
      onClick: () => {
        resetTextTranslation();
        resetDocumentTranslation();
      },
    },
    // Signed in: Help is on the Profile page, with Feedback and the language,
    // which leaves room for the orders bureaus have assigned.
    ...(token
      ? [
          { label: t("projects"), href: "/projects" as const, icon: FolderOpen },
          { label: t("orders"), href: "/orders" as const, icon: ClipboardList },
          { label: t("profile"), href: "/profile" as const, icon: User },
        ]
      : [
          { label: t("help"), href: "/help" as const, icon: HelpCircle },
          { label: t("login"), href: "/sign-in" as const, icon: User },
        ]),
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
                  ? "text-accent-text font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent-text" : ""}`} />
              <span className="max-w-full truncate px-1 text-xs leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
