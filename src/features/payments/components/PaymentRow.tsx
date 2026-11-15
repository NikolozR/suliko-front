"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PaymentRecord } from "../paymentHistoryService";

const STATUS_STYLE: Record<PaymentRecord["status"], string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  refunded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function PaymentRow({ payment: p, compact = false }: { payment: PaymentRecord; compact?: boolean }) {
  const t = useTranslations("Payments");
  const locale = useLocale();

  const date = p.date
    ? new Date(p.date).toLocaleString(locale, compact ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" })
    : "-";
  const amount = new Intl.NumberFormat(locale, { style: "currency", currency: p.currency }).format(p.amount);

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{p.description || t("payment")}</p>
        <p className="text-xs text-muted-foreground">
          {date}
          {p.cardLast4 ? ` · •••• ${p.cardLast4}` : ""}
          {p.pages ? ` · +${p.pages} ${t("pages")}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">{amount}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[p.status]}`}>
          {t(`status.${p.status}`)}
        </span>
      </div>
    </li>
  );
}
