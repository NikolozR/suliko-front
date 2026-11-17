import { requireAdminPage } from "@/features/admin/access";
import PromoCodesManager from "./PromoCodesManager";

export default async function AdminPromoCodesPage() {
  await requireAdminPage("/admin/promo-codes");

  return <PromoCodesManager />;
}
