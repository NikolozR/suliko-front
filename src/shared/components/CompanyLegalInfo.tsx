"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import {
  COMPANY_ID,
  COMPANY_NAME_EN,
  COMPANY_NAME_KA,
} from "@/shared/constants/company";

/**
 * Single line identifying the entity that collects payments. Rendered wherever a
 * payment can start; see the note in constants/company.ts.
 */
export default function CompanyLegalInfo({ className }: { className?: string }) {
  const t = useTranslations("Company");
  const locale = useLocale();

  // Georgian readers get the registered name on its own; everyone else gets the
  // readable form with the registered one alongside it.
  const name =
    locale === "ka"
      ? COMPANY_NAME_KA
      : `${COMPANY_NAME_EN} (${COMPANY_NAME_KA})`;

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {t("legalEntity", { name, id: COMPANY_ID })}
    </p>
  );
}
