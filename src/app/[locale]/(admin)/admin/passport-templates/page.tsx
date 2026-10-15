import { isAdminRequest } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getAdminPassportTemplates } from "@/lib/site-content-admin";
import PassportTemplatesTable from "./PassportTemplatesTable";

export default async function AdminPassportTemplatesPage() {
  if (!(await isAdminRequest())) redirect("/en/admin/login");

  const templates = await getAdminPassportTemplates();

  if (!templates) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 13, background: "#1a0a0a", padding: 16, borderRadius: 8, border: "1px solid #7f1d1d" }}>
          ⚠ The templates could not be loaded from the API. Reload the page to try again.
        </p>
      </div>
    );
  }

  return <PassportTemplatesTable initialTemplates={templates} />;
}
