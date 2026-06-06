"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import type { PassportTemplate } from "@/lib/passport-types";

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
    await fetch(`/api/passport-templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setToggling(id);
    const res = await fetch(`/api/passport-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentActive } : t))
      );
    }
    setToggling(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc", margin: 0 }}>
          Passport Templates
        </h2>
        <Link
          href={`/${locale}/admin/passport-templates/new`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f59e0b",
            color: "#0f1117",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "'Syne', sans-serif",
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
        <div style={{ color: "#64748b", padding: "32px 0", textAlign: "center", fontSize: 14 }}>
          No passport templates yet. Create your first one.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2d3a" }}>
                {["Name", "Country", "Fields", "Status", "Created", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#64748b",
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
                <tr key={tmpl.id} style={{ borderBottom: "1px solid #1a1d28" }}>
                  <td style={{ padding: "12px", color: "#f1f5f9" }}>
                    <span style={{ fontWeight: 600 }}>{tmpl.name}</span>
                  </td>
                  <td style={{ padding: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {tmpl.country}
                  </td>
                  <td style={{ padding: "12px", color: "#94a3b8" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "#1e2130",
                        border: "1px solid #2a2d3a",
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
                        background: tmpl.is_active ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.15)",
                        color: tmpl.is_active ? "#4ade80" : "#64748b",
                        border: `1px solid ${tmpl.is_active ? "rgba(34,197,94,0.25)" : "rgba(100,116,139,0.3)"}`,
                        cursor: "pointer",
                        opacity: toggling === tmpl.id ? 0.5 : 1,
                      }}
                    >
                      {tmpl.is_active ? <Eye size={10} /> : <EyeOff size={10} />}
                      {tmpl.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
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
                          border: "1px solid #2a2d3a",
                          borderRadius: 6,
                          color: "#94a3b8",
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
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: 6,
                          color: "#f87171",
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
