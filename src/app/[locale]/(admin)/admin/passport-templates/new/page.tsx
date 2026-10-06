import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PassportTemplateForm from "../PassportTemplateForm";

export default async function NewPassportTemplatePage() {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  return <PassportTemplateForm />;
}
