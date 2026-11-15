// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ExpenseForm } from "@office/features/finances/components/expense-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { todayIn } from "@office/shared/lib/dates";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("newExpense");

export default async function NewExpensePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("finance.expenses", locale);
  const t = await getTranslations("finances");

  // `?order_id=` fills the order in, for a link from an order screen.
  const query = await searchParams;
  const raw = Array.isArray(query.order_id) ? query.order_id[0] : query.order_id;
  const orderId = Number(raw);
  const fromOrder = Number.isInteger(orderId) && orderId > 0;

  return (
    <>
      <PageHeader
        {...sectionMark("finances")}
        title={t("newExpense.title")}
        description={t("newExpense.description")}
        actions={
          // Back to wherever this was opened from: returning to Finances from
          // an order's link would lose the order being worked on.
          fromOrder ? (
            <BackLink href={`/translations/${orderId}`} label={t("backToOrder")} />
          ) : (
            <BackLink href="/finances?tab=expenses" label={t("backToFinances")} />
          )
        }
      />
      <ExpenseForm today={todayIn(session.timezone)} orderId={fromOrder ? orderId : undefined} />
    </>
  );
}
