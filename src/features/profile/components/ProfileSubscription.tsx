"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { cancelSubscription } from "@/features/pricing/services/subscriptionService";
import type { SubscriptionInfo } from "@/features/auth/types/types.User";

const STATUS_CLASS: Record<SubscriptionInfo["status"], string> = {
  Active: "text-green-600",
  PastDue: "text-amber-600",
  Canceled: "text-red-600",
  Expired: "text-red-600",
};

export function ProfileSubscription({ subscription, onChanged }: { subscription: SubscriptionInfo; onChanged: () => Promise<void> | void }) {
  const t = useTranslations("Profile.subscription");
  const locale = useLocale();
  const [canceling, setCanceling] = useState(false);

  const cancel = async () => {
    setCanceling(true);
    try {
      await cancelSubscription();
      await onChanged();
    } catch {
      /* the profile reload shows the real state */
    } finally {
      setCanceling(false);
    }
  };

  const rows: [string, React.ReactNode][] = [
    [t("plan"), <span key="p" className="font-medium capitalize">{subscription.planName}</span>],
    [t("status"), <span key="s" className={`font-medium ${STATUS_CLASS[subscription.status]}`}>{t(`statuses.${subscription.status}`)}</span>],
    [t("pagesUsed"), <span key="u" className="font-medium">{subscription.pagesUsed} / {subscription.monthlyPageLimit ?? "∞"}</span>],
    [subscription.autoRenew ? t("renewsOn") : t("accessUntil"), <span key="d" className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)}</span>],
  ];

  return (
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-6 md:px-8">
        <CardTitle className="text-lg font-semibold">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 md:px-8 pb-6">
        <dl className="flex flex-col gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {subscription.autoRenew && (
          <button
            type="button"
            onClick={cancel}
            disabled={canceling}
            className="mt-4 text-sm text-red-500 underline hover:text-red-600 disabled:opacity-50"
          >
            {canceling ? t("canceling") : t("cancel")}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
