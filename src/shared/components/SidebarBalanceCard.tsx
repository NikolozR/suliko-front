"use client";

import { Link } from "@/i18n/navigation";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/features/auth/types/types.User";
import { formatBalance } from "@/shared/utils/domainUtils";
import { getBalanceExpiry, EXPIRY_TEXT_CLASS } from "@/shared/utils/balanceExpiry";

/** Pages the bar counts as "full" for pay-as-you-go credit. */
const FULL_BAR_PAGES = 50;

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-emerald-200/60 dark:bg-emerald-900/40 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SidebarBalanceCard({ profile, collapsed }: { profile: UserProfile; collapsed: boolean }) {
  const t = useTranslations("Sidebar");
  const tA = useTranslations("A11y");
  const sub = profile.subscription?.status === "Active" ? profile.subscription : null;

  let body: React.ReactNode;
  if (sub) {
    const pct = sub.monthlyPageLimit ? Math.min(100, (sub.pagesUsed / sub.monthlyPageLimit) * 100) : 0;
    const color = pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-red-500";
    body = (
      <>
        <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70 capitalize">{sub.planName}</span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
          {sub.pagesUsed} / {sub.monthlyPageLimit ?? "∞"} {t("pages")}
        </span>
        <Bar pct={pct} color={color} />
      </>
    );
  } else {
    const balance = profile.balance || 0;
    const pct = Math.min(100, (balance / FULL_BAR_PAGES) * 100);
    const color = pct > 40 ? "bg-emerald-500" : pct > 10 ? "bg-amber-500" : "bg-red-500";
    const exp = balance > 0 ? getBalanceExpiry(profile.balanceExpiresAt) : null;
    body = (
      <>
        <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70">{t("balance")}</span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
          {formatBalance(balance)} {t("pages")}
        </span>
        <Bar pct={pct} color={color} />
        {exp && (
          <span className={`mt-1 text-[11px] ${EXPIRY_TEXT_CLASS[exp.level]}`}>
            {exp.level === "expired" ? t("expired") : t("expiresIn", { days: exp.daysLeft })}
          </span>
        )}
      </>
    );
  }

  // One link around the whole card: a single tab stop, and the whole card is the target.
  return (
    <Link
      href="/price"
      aria-label={tA("balanceAndPlans")}
      className={`flex items-center gap-3 p-3 rounded-lg mb-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:opacity-80 transition-opacity ${collapsed ? "justify-center" : ""}`}
    >
      <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="flex flex-col min-w-0 w-full">{body}</span>}
    </Link>
  );
}
