"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/features/ui/components/ui/button";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { usePortalMe } from "../hooks/usePortalMe";

export function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 border border-border/60">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function OrdersNotice({ tone = "info", children }: { tone?: "info" | "error"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : ClipboardList;
  return (
    <div
      className={
        tone === "error"
          ? "flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400"
          : "flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60 text-muted-foreground"
      }
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

export function BackToOrders() {
  const t = useTranslations("Orders");
  return (
    <Link
      href="/orders"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("back")}
    </Link>
  );
}

/**
 * Renders its children only for a signed-in translator. Everyone else gets a
 * plain explanation instead of an error: the Orders tab is hidden for them,
 * but a bookmarked link should still say something sensible.
 */
export function OrdersGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Orders");
  const token = useAuthStore((state) => state.token);
  const { status, isTranslator, reload } = usePortalMe();

  // The token is restored from localStorage in the browser only; waiting one
  // render keeps the server and client markup identical.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <OrdersSkeleton />;

  if (!token) {
    return (
      <OrdersNotice>
        <p>{t("signInPrompt")}</p>
        <Button asChild size="sm" className="suliko-default-bg text-primary-foreground dark:text-white">
          <Link href="/sign-in">{t("signIn")}</Link>
        </Button>
      </OrdersNotice>
    );
  }

  if (status === "idle" || status === "loading") return <OrdersSkeleton />;

  if (status === "error") {
    return (
      <OrdersNotice tone="error">
        <p>{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          {t("retry")}
        </Button>
      </OrdersNotice>
    );
  }

  if (!isTranslator) {
    return (
      <OrdersNotice>
        <p>{t("notTranslator")}</p>
      </OrdersNotice>
    );
  }

  return <>{children}</>;
}
