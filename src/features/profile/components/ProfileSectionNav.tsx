"use client";

import { useTranslations } from "next-intl";
import { Gift, Lock, SlidersHorizontal, User, Wallet } from "lucide-react";

export const PROFILE_SECTIONS = ["account", "billing", "security", "preferences", "invite"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

const ICONS = { account: User, billing: Wallet, security: Lock, preferences: SlidersHorizontal, invite: Gift } as const;

/**
 * Underlined tabs under the header. The app sidebar is already a vertical menu;
 * a second one beside it made the page lean left, so sections sit across the top.
 */
export function ProfileSectionNav({ active, onChange }: { active: ProfileSection; onChange: (s: ProfileSection) => void }) {
  const t = useTranslations("Profile.sections");

  return (
    <nav aria-label={t("label")} className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {PROFILE_SECTIONS.map((id) => {
          const Icon = ICONS[id];
          const isActive = id === active;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(id)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
