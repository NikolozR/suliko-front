import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getAdminPassportTemplate } from "@/lib/site-content-admin";
import PassportTemplateForm from "../../PassportTemplateForm";

export default async function EditPassportTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  const { id } = await params;

  const template = await getAdminPassportTemplate(id);
  if (!template) redirect("/en/admin/passport-templates");

  return <PassportTemplateForm initial={template} />;
}
