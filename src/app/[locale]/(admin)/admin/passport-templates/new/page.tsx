import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PassportTemplateForm from "../PassportTemplateForm";

export default async function NewPassportTemplatePage() {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  return <PassportTemplateForm />;
}
