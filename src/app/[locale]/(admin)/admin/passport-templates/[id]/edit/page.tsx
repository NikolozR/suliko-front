import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PassportTemplateForm from "../../PassportTemplateForm";
import type { PassportTemplate } from "@/lib/passport-types";

export default async function EditPassportTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("passport_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) redirect("/en/admin/passport-templates");

  return <PassportTemplateForm initial={data as PassportTemplate} />;
}
