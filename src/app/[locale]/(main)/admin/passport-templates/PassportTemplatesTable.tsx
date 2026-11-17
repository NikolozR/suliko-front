"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import type { PassportTemplate } from "@/lib/passport-types";
import { deletePassportTemplate, savePassportTemplate } from "@/lib/site-content-client";

interface Props {
  initialTemplates: PassportTemplate[];
}

export default function PassportTemplatesTable({ initialTemplates }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [templates, setTemplates] = useState<PassportTemplate[]>(initialTemplates);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this template permanently?")) return;
    setDeleting(id);
    try {
      await deletePassportTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
    setDeleting(null);
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setToggling(id);
    try {
      await savePassportTemplate(id, { is_active: !currentActive });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentActive } : t))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
    setToggling(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 18, color: "var(--foreground)", margin: 0 }}>
          Passport Templates
        </h2>
        <Link
          href={`/${locale}/admin/passport-templates/new`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent-text)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <Plus size={14} />
          New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div style={{ color: "var(--muted-foreground)", padding: "32px 0", textAlign: "center", fontSize: 14 }}>
          No passport templates yet. Create your first one.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Name", "Country", "Fields", "Status", "Created", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "var(--muted-foreground)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      fontSize: 11,
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr key={tmpl.id} style={{ borderBottom: "1px solid var(--muted)" }}>
                  <td style={{ padding: "12px", color: "var(--foreground)" }}>
                    <span style={{ fontWeight: 600 }}>{tmpl.name}</span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {tmpl.country}
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "var(--muted)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 11,
                      }}
                    >
                      {tmpl.fields?.length || 0} fields
                    </span>
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => handleToggleActive(tmpl.id, tmpl.is_active)}
                      disabled={toggling === tmpl.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: tmpl.is_active ? "color-mix(in srgb, var(--status-success) 12%, transparent)" : "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                        color: tmpl.is_active ? "var(--status-success)" : "var(--muted-foreground)",
                        border: `1px solid ${tmpl.is_active ? "color-mix(in srgb, var(--status-success) 25%, transparent)" : "color-mix(in srgb, var(--muted-foreground) 30%, transparent)"}`,
                        cursor: "pointer",
                        opacity: toggling === tmpl.id ? 0.5 : 1,
                      }}
                    >
                      {tmpl.is_active ? <Eye size={10} /> : <EyeOff size={10} />}
                      {tmpl.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {new Date(tmpl.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/${locale}/admin/passport-templates/${tmpl.id}/edit`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          color: "var(--muted-foreground)",
                          fontSize: 12,
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={12} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(tmpl.id)}
                        disabled={deleting === tmpl.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          background: "transparent",
                          border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                          borderRadius: 6,
                          color: "var(--destructive)",
                          fontSize: 12,
                          cursor: "pointer",
                          opacity: deleting === tmpl.id ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                        {deleting === tmpl.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
