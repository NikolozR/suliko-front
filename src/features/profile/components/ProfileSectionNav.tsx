"use client";

import { useTranslations } from "next-intl";
import { Gift, Lock, SlidersHorizontal, User, Wallet } from "lucide-react";

export const PROFILE_SECTIONS = ["account", "billing", "security", "preferences", "invite"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

const ICONS = { account: User, billing: Wallet, security: Lock, preferences: SlidersHorizontal, invite: Gift } as const;

/** A column of buttons on desktop, a scrolling row of tabs on a phone. */
export function ProfileSectionNav({ active, onChange }: { active: ProfileSection; onChange: (s: ProfileSection) => void }) {
  const t = useTranslations("Profile.sections");

  return (
    <nav aria-label={t("label")} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:w-48 md:shrink-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
      {PROFILE_SECTIONS.map((id) => {
        const Icon = ICONS[id];
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(id)}
          </button>
        );
      })}
    </nav>
  );
}
