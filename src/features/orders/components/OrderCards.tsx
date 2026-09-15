"use client";

import { Building2, ClipboardList, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import type { AssignedOrder, PersonalOrderSummary } from "../types/types.Orders";
import { DueDate, LanguagePairBadges } from "./OrderMeta";

const cardClass =
  "relative p-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-[border-color,box-shadow] group";

export function AssignedOrderCard({ order }: { order: AssignedOrder }) {
  const t = useTranslations("Orders");
  return (
    <Card className={cardClass}>
      <Link
        href={`/orders/org/${order.organization.slug}/${order.order_id}`}
        className="absolute inset-0 z-0"
        aria-label={t("orderNumber", { id: order.order_id })}
      />
      <div className="relative pointer-events-none flex items-start gap-4">
        <div className="p-2.5 rounded-lg shrink-0 bg-sky-50 dark:bg-sky-950/40">
          <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {t("orderNumber", { id: order.order_id })}
            </h3>
            <span className="text-sm text-muted-foreground truncate">{order.client_name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {order.organization.name}
            </span>
            <DueDate value={order.due_date} />
            <span className="text-xs text-muted-foreground">
              {t("documentCount", { count: order.documents.length })}
            </span>
          </div>
          <LanguagePairBadges pairs={order.documents} />
        </div>
      </div>
    </Card>
  );
}

export function PersonalOrderCard({ order }: { order: PersonalOrderSummary }) {
  const t = useTranslations("Orders");
  const files = order.source_file_count + order.translation_file_count;
  return (
    <Card className={cardClass}>
      <Link
        href={`/orders/personal/${order.id}`}
        className="absolute inset-0 z-0"
        aria-label={t("personalOrderNumber", { id: order.id })}
      />
      <div className="relative pointer-events-none flex items-start gap-4">
        <div className="p-2.5 rounded-lg shrink-0 bg-violet-50 dark:bg-violet-950/40">
          <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {order.client_name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t("personalOrderNumber", { id: order.id })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <DueDate value={order.due_date} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              {t("fileCount", { count: files })}
            </span>
          </div>
          <LanguagePairBadges pairs={order.language_pairs} />
        </div>
      </div>
    </Card>
  );
}
