"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Save, ArrowLeft, GripVertical, Loader2 } from "lucide-react";
import type { PassportTemplate, PassportTemplateField } from "@/lib/passport-types";

interface Props {
  initial?: PassportTemplate;
}

export default function PassportTemplateForm({ initial }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name || "");
  const [country, setCountry] = useState(initial?.country || "");
  const [docxUrl, setDocxUrl] = useState(initial?.docx_file_url || "");
  const [fields, setFields] = useState<PassportTemplateField[]>(initial?.fields || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [docxFileName, setDocxFileName] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setDocxFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/passport-templates/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      setDocxUrl(data.url);

      const existingKeys = new Set(fields.map((f) => f.key));
      const newFields: PassportTemplateField[] = [...fields];

      data.placeholders.forEach((key: string, i: number) => {
        if (!existingKeys.has(key)) {
          newFields.push({
            key,
            label: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: "",
            order: fields.length + i + 1,
          });
        }
      });

      setFields(newFields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
    setUploading(false);
  }

  function updateField(index: number, patch: Partial<PassportTemplateField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((f, i) => ({ ...f, order: i + 1 }));
    });
  }

  function removeField(index: number) {
    setFields((prev) =>
      prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 }))
    );
  }

  async function handleSave() {
    if (!name.trim() || !country.trim() || !docxUrl) {
      setError("Name, country, and DOCX file are required.");
      return;
    }

    setSaving(true);
    setError("");

    const body = {
      name: name.trim(),
      country: country.trim(),
      docx_file_url: docxUrl,
      fields,
    };

    try {
      const url = isEdit
        ? `/api/passport-templates/${initial!.id}`
        : "/api/passport-templates";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Save failed");
        setSaving(false);
        return;
      }

      router.push(`/${locale}/admin/passport-templates`);
      router.refresh();
    } catch {
      setError("Save failed. Please try again.");
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "#1a1d28",
    border: "1px solid #2a2d3a",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push(`/${locale}/admin/passport-templates`)}
          style={{
            background: "transparent",
            border: "1px solid #2a2d3a",
            borderRadius: 8,
            padding: "8px",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc", margin: 0 }}>
          {isEdit ? "Edit Template" : "New Passport Template"}
        </h2>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            color: "#f87171",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Georgian Passport"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Georgia"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>DOCX Template File</label>
        <div
          style={{
            border: "2px dashed #2a2d3a",
            borderRadius: 8,
            padding: "24px",
            textAlign: "center",
            position: "relative",
            cursor: "pointer",
            background: uploading ? "#1a1d28" : "transparent",
          }}
        >
          <input
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
          {uploading ? (
            <div style={{ color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
              Uploading & parsing...
            </div>
          ) : docxUrl ? (
            <div style={{ color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Upload size={16} />
              {docxFileName || "Template uploaded"} — Click to replace
            </div>
          ) : (
            <div style={{ color: "#64748b" }}>
              <Upload size={20} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14 }}>Click or drag to upload .docx template</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {"Use {{placeholder}} markers for dynamic fields"}
              </div>
            </div>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            Template Fields ({fields.length} detected)
          </label>
          <div
            style={{
              background: "#1a1d28",
              border: "1px solid #2a2d3a",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 1.5fr 1.5fr 80px",
                gap: 0,
                padding: "8px 12px",
                borderBottom: "1px solid #2a2d3a",
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span></span>
              <span>Key</span>
              <span>Label</span>
              <span>Description</span>
              <span></span>
            </div>
            {fields.map((field, i) => (
              <div
                key={field.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 1.5fr 1.5fr 80px",
                  gap: 0,
                  padding: "8px 12px",
                  borderBottom: i < fields.length - 1 ? "1px solid #1e2130" : "none",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button
                    onClick={() => moveField(i, -1)}
                    disabled={i === 0}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: i === 0 ? "#2a2d3a" : "#64748b",
                      cursor: i === 0 ? "default" : "pointer",
                      padding: 0,
                      fontSize: 10,
                    }}
                  >
                    ▲
                  </button>
                  <GripVertical size={12} style={{ color: "#2a2d3a" }} />
                  <button
                    onClick={() => moveField(i, 1)}
                    disabled={i === fields.length - 1}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: i === fields.length - 1 ? "#2a2d3a" : "#64748b",
                      cursor: i === fields.length - 1 ? "default" : "pointer",
                      padding: 0,
                      fontSize: 10,
                    }}
                  >
                    ▼
                  </button>
                </div>
                <code
                  style={{
                    fontSize: 12,
                    color: "#f59e0b",
                    background: "#0f1117",
                    padding: "2px 6px",
                    borderRadius: 4,
                    width: "fit-content",
                  }}
                >
                  {`{{${field.key}}}`}
                </code>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  placeholder="Field label"
                  style={{
                    ...inputStyle,
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                />
                <input
                  type="text"
                  value={field.description}
                  onChange={(e) => updateField(i, { description: e.target.value })}
                  placeholder="Helper text (optional)"
                  style={{
                    ...inputStyle,
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={() => removeField(i)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 4,
                    color: "#f87171",
                    fontSize: 11,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f59e0b",
            color: "#0f1117",
            padding: "10px 24px",
            borderRadius: 8,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={14} />
          {saving ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
        </button>
        <button
          onClick={() => router.push(`/${locale}/admin/passport-templates`)}
          style={{
            padding: "10px 24px",
            background: "transparent",
            border: "1px solid #2a2d3a",
            borderRadius: 8,
            color: "#94a3b8",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
