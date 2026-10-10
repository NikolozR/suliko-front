"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronRight, ClipboardList } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { fetchAssignments, type OrdersLoad } from "@/features/orders/api";
import type { AssignedOrder } from "@/features/orders/types";

/** The orders translation bureaus have assigned to this translator. */
export default function OrdersPage() {
  const t = useTranslations("Orders");
  const tTitles = useTranslations("PageTitles");
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

      {result && result.status !== "ok" && (
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
  return (
    <Link href={`/orders/${order.organization.slug}/${order.order_id}`} className="block">
      <Card className="p-4 border border-border/60 hover:border-border transition-colors">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {t("order", { id: order.order_number ?? "" })} · {order.organization.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("client")}: {order.client_name} · {t("documents")}: {order.documents.length} (
              {t("pages", { count: pages })})
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            {order.due_date ? `${t("due")} ${order.due_date}` : t("noDue")}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
