"use client";

import { ChevronRight, Globe, HelpCircle, MessageSquare, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

const LINKS = [
  { label: "help", href: "/help", icon: HelpCircle },
  { label: "feedback", href: "/feedback", icon: MessageSquare },
] as const;

/**
 * The site language, Help and Feedback. They were in the sidebar; for someone
 * signed in they live here, which keeps the sidebar to the places people work
 * in. A visitor still has them in the sidebar.
 */
export const ProfileLanguageAndHelp = () => {
  const t = useTranslations("Profile");
  const tSidebar = useTranslations("Sidebar");

  return (
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-6 md:px-8">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="p-1.5 rounded-lg bg-muted">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </div>
          {t("languageAndHelp")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-5 pb-4 pt-2">
        <div className="flex items-center justify-between gap-4 px-3 py-2.5">
          <span className="flex items-center gap-3 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {t("language")}
          </span>
          <LanguageSwitcher />
        </div>
        {LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted/60"
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {tSidebar(label)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
