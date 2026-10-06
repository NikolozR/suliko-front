"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Ticket, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { formatBalance } from "@/shared/utils/domainUtils";
import { redeemCoupon } from "../services/promoCodeService";
import { RedeemCouponError } from "../types";

type Status = { kind: "success"; amount: number } | { kind: "error"; message: string } | null;

/** Lets a signed-in user add pages to their balance with an admin-issued coupon. */
export function CouponRedeemCard({ className }: { className?: string }) {
  const t = useTranslations("Coupon");
  const token = useAuthStore((s) => s.token);
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  // The token lives in persisted client storage, so render only after mount to keep the server
  // and first client render identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await redeemCoupon(trimmed);
      setStatus({ kind: "success", amount: result.amount });
      setCode("");
      await fetchUserProfile();
    } catch (error) {
      const errorCode = error instanceof RedeemCouponError ? error.code : "unknown";
      setStatus({ kind: "error", message: t(`errors.${errorCode}`) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-suliko-default-color" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            className="font-mono tracking-wider"
          />
          <Button type="submit" disabled={!code.trim() || submitting} className="shrink-0">
            {submitting ? t("applying") : t("apply")}
          </Button>
        </form>
        {status?.kind === "success" && (
          <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t("success", { pages: formatBalance(status.amount) })}
          </p>
        )}
        {status?.kind === "error" && (
          <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
