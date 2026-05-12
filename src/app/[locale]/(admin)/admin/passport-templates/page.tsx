import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PassportTemplatesTable from "./PassportTemplatesTable";
import type { PassportTemplate } from "@/lib/passport-types";

export default async function AdminPassportTemplatesPage() {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  const { data, error } = await supabaseAdmin
    .from("passport_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 13, background: "#1a0a0a", padding: 16, borderRadius: 8, border: "1px solid #7f1d1d" }}>
          ⚠ Supabase error: {error.message}<br />
          Code: {error.code}<br />
          Details: {JSON.stringify(error.details)}
        </p>
      </div>
    );
  }

  const templates: PassportTemplate[] = (data as PassportTemplate[]) ?? [];

  return <PassportTemplatesTable initialTemplates={templates} />;
}
