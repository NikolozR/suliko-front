"use client";

import { useTranslations } from "next-intl";
import { Plus, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import type { UserProfile } from "@/features/auth/types/types.User";
import { formatBalance } from "@/shared/utils/domainUtils";
import { getBalanceExpiry, EXPIRY_TEXT_CLASS } from "@/shared/utils/balanceExpiry";

export function ProfileBalanceCard({ userProfile }: { userProfile: UserProfile }) {
  const t = useTranslations("Profile");
  const balance = userProfile.balance || 0;
  const exp = balance > 0 ? getBalanceExpiry(userProfile.balanceExpiresAt) : null;
  const expiryText = !exp ? t("validOneMonth") : exp.level === "expired" ? t("expired") : t("expiresIn", { days: exp.daysLeft });

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/40">
      <Wallet className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <div className="min-w-[10rem] flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t("currentBalance")}</p>
        <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{formatBalance(balance)} {t("pages")}</p>
        <p className={`text-xs ${EXPIRY_TEXT_CLASS[exp?.level ?? "ok"]}`}>{expiryText}</p>
      </div>
      <Link href="/price">
        <Button className="gap-2 border-0 bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" aria-hidden />
          {t("fillBalance")}
        </Button>
      </Link>
    </div>
  );
}
