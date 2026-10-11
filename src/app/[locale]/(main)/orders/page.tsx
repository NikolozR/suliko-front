"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronRight, ClipboardList } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { fetchAssignments, type OrdersLoad } from "@/features/orders/api";
import { DueBadge, SentChip } from "@/features/orders/components/OrderBadges";
import type { AssignedOrder } from "@/features/orders/types";

/** The orders translation bureaus have assigned to this translator. */
export default function OrdersPage() {
  const t = useTranslations("Orders");
  const tTitles = useTranslations("PageTitles");
  const tSidebar = useTranslations("Sidebar");
  useDocumentTitle(tTitles("orders"));
  const [result, setResult] = useState<OrdersLoad<AssignedOrder[]> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAssignments().then((loaded) => {
      if (!cancelled) setResult(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-8">{t("subtitle")}</p>

      {result === null && (
        <div className="space-y-3" aria-label={t("loading")}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 border border-border/60">
              <Skeleton className="h-5 w-2/5 mb-2" />
              <Skeleton className="h-3 w-3/5" />
            </Card>
          ))}
        </div>
      )}

      {/* Not an error: nobody has added this account as a translator yet.
          It used to read "Could not load your orders. Please try again",
          and trying again could never help. */}
      {result?.status === "notTranslator" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p className="text-sm font-medium text-foreground">{t("notLinkedTitle")}</p>
          <p className="text-sm max-w-md">{t("notLinkedBody")}</p>
        </div>
      )}

      {result?.status === "signedOut" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p className="text-sm font-medium text-foreground">{t("signedOut")}</p>
          <Link href="/sign-in" className="text-sm font-medium text-suliko-default-color hover:underline">
            {tSidebar("login")}
          </Link>
        </div>
      )}

      {result && !["ok", "notTranslator", "signedOut"].includes(result.status) && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{result.status === "unavailable" ? t("unavailable") : t("error")}</p>
        </div>
      )}

      {result?.status === "ok" && result.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      )}

      {result?.status === "ok" && result.data.length > 0 && (
        <ul className="space-y-3">
          {result.data.map((order) => (
            <li key={`${order.organization.slug}-${order.order_id}`}>
              <OrderRow order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: AssignedOrder }) {
  const t = useTranslations("Orders");
  const pages = order.documents.reduce((sum, document) => sum + document.page_count, 0);
  // What is left to do, where the Office API says what has been handed in.
  const total = order.documents.length;
  const counted = order.documents.every((document) => typeof document.my_translations === "number");
  const sent = order.documents.filter((document) => (document.my_translations ?? 0) > 0).length;
  return (
    <Link href={`/orders/${order.organization.slug}/${order.order_id}`} className="block">
      <Card className="p-4 border border-border/60 hover:border-border transition-colors">
        <div className="flex items-center gap-4">
          {/* On a phone the badges sit under the order, not squeezed beside it. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-medium truncate">
                {t("order", { id: order.order_number ?? "" })} · {order.organization.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("client")}: {order.client_name} · {t("documents")}: {total} (
                {t("pages", { count: pages })})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {counted && total > 0 && <SentChip sent={sent} total={total} />}
              <DueBadge dueDate={order.due_date} done={counted && total > 0 && sent >= total} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
