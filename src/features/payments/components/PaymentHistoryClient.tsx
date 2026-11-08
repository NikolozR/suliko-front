"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { getPaymentHistory, PaymentRecord } from "../paymentHistoryService";

const STATUS_STYLE: Record<PaymentRecord["status"], string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  refunded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function PaymentHistoryClient() {
  const t = useTranslations("Payments");
  const locale = useLocale();
  const [items, setItems] = useState<PaymentRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPaymentHistory().then(setItems).catch(() => setError(true));
  }, []);

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "—";
  const fmtAmount = (p: PaymentRecord) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: p.currency }).format(p.amount);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Receipt className="h-6 w-6" /> {t("title")}
        </h1>
        <Link href="/price" className="text-sm font-semibold text-emerald-600 hover:underline">
          {t("topUp")}
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{t("error")}</p>}

      {!items && !error && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-border bg-card p-8 text-center">
          {t("empty")}
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.description || t("payment")}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(p.date)}
                  {p.cardLast4 ? ` · •••• ${p.cardLast4}` : ""}
                  {p.pages ? ` · +${p.pages} ${t("pages")}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold">{fmtAmount(p)}</p>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[p.status]}`}>
                  {t(`status.${p.status}`)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
