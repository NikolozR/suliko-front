"use client";

import { Link } from "@/i18n/navigation";
import { Plus, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/features/auth/types/types.User";
import { formatBalance } from "@/shared/utils/domainUtils";
import { getBalanceExpiry, EXPIRY_TEXT_CLASS } from "@/shared/utils/balanceExpiry";

/** Pages the bar counts as "full" for pay-as-you-go credit. */
const FULL_BAR_PAGES = 50;

/**
 * Balance and top-up in one row: the card opens the plans page, the + is the same
 * destination as a button of its own so "how do I pay" is answered at a glance.
 */
export function SidebarBalanceCard({ profile, collapsed }: { profile: UserProfile; collapsed: boolean }) {
  const t = useTranslations("Sidebar");
  const tA = useTranslations("A11y");
  const sub = profile.subscription?.status === "Active" ? profile.subscription : null;

  const balance = profile.balance || 0;
  const exp = !sub && balance > 0 ? getBalanceExpiry(profile.balanceExpiresAt) : null;

  const pct = sub
    ? sub.monthlyPageLimit ? Math.min(100, (sub.pagesUsed / sub.monthlyPageLimit) * 100) : 0
    : Math.min(100, (balance / FULL_BAR_PAGES) * 100);
  const barColor = sub
    ? pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-red-500"
    : pct > 40 ? "bg-emerald-500" : pct > 10 ? "bg-amber-500" : "bg-red-500";

  const needsAttention = sub ? pct >= 85 : balance <= 5 || exp?.level === "urgent" || exp?.level === "expired";
  const headline = sub
    ? `${sub.pagesUsed} / ${sub.monthlyPageLimit ?? "∞"} ${t("pages")}`
    : `${formatBalance(balance)} ${t("pages")}`;
  const sublabel = sub
    ? sub.planName
    : exp
      ? exp.level === "expired" ? t("expired") : t("expiresIn", { days: exp.daysLeft })
      : null;

  if (collapsed) {
    return (
      <Link
        href="/price"
        title={`${headline} - ${t("topUp")}`}
        aria-label={tA("balanceAndPlans")}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40"
      >
        <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {needsAttention && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--sidebar)]" />}
      </Link>
    );
  }

  return (
    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <Link href="/price" aria-label={tA("balanceAndPlans")} className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
          <Wallet className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-emerald-700 dark:text-emerald-300">{headline}</span>
            {sublabel && (
              <span className={`truncate text-[11px] ${exp ? EXPIRY_TEXT_CLASS[exp.level] : "text-emerald-700/70 dark:text-emerald-400/70"}`}>
                {sublabel}
              </span>
            )}
          </span>
        </Link>
        <Link
          href="/price"
          title={t("topUp")}
          aria-label={t("topUp")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-900/40">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
