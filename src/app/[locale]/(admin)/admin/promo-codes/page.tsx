import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PromoCodesManager from "./PromoCodesManager";

export default async function AdminPromoCodesPage() {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  return <PromoCodesManager />;
}
