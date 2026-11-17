import { requireAdminPage } from "@/features/admin/access";
import PassportTemplateForm from "../PassportTemplateForm";

export default async function NewPassportTemplatePage() {
  await requireAdminPage("/admin/passport-templates/new");

  return <PassportTemplateForm />;
}
