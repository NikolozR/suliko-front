"use client";

import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { AssignmentsList } from "@/features/orders/components/AssignmentsList";
import { PageHeader } from "@office/shared/components/page-header";

/**
 * The orders translation bureaus have assigned to this translator, for someone
 * without Office. Signed in to Office, the same list is Orders' "From bureaus"
 * view (the middleware sends /assignments there).
 */
export default function OrdersPage() {
  const t = useTranslations("Orders");
  const tTitles = useTranslations("PageTitles");
  useDocumentTitle(tTitles("orders"));

  return (
    <div className="max-w-3xl px-4 py-6 md:px-6">
      <PageHeader icon={ClipboardList} hue="blue" title={t("title")} description={t("subtitle")} />
      <AssignmentsList />
    </div>
  );
}
