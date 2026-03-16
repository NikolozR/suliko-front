"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f1117",
  border: "1px solid #2a2d3a",
  borderRadius: 8,
  padding: "11px 14px",
  color: "#f8fafc",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 8,
};

export default function LanguageManager() {
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState("");
  const [nameGeo, setNameGeo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!token) { setError("Missing auth token. Please re-login as admin."); return; }
    if (!name.trim() || !nameGeo.trim()) { setError("Both English and Georgian names are required."); return; }
    setLoading(true);
    try {
      // Fetch existing languages to determine next ID
      const getRes = await fetch(`${API_BASE_URL}/Language`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!getRes.ok) throw new Error(`Failed to fetch existing languages: ${getRes.status}`);
      const existing = await getRes.json();
      let maxId = 0;
      const list = Array.isArray(existing) ? existing : (existing?.items ?? existing?.data ?? []);
      if (Array.isArray(list) && list.length > 0) {
        maxId = Math.max(...list.map((l: { id?: number }) => l.id || 0));
      }
      const newId = maxId + 1;
      const body = { id: newId, name: name.trim(), nameGeo: nameGeo.trim() };

      // Try POST first, fall back to PUT
      let response = await fetch(`${API_BASE_URL}/Language`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/Language`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to save language: ${response.status} — ${errText}`);
      }

      setMessage(`Language "${name.trim()}" saved with ID ${newId}.`);
      setName("");
      setNameGeo("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save language");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#13151f",
        border: "1px solid #2a2d3a",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #2a2d3a" }}>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "#f8fafc",
          }}
        >
          Add Language
        </span>
        <p style={{ color: "#475569", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
          ID is auto-assigned as next available integer.
        </p>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Name (EN)</label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. English"
                onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
              />
            </div>
            <div>
              <label style={labelStyle}>Name (KA)</label>
              <input
                style={inputStyle}
                value={nameGeo}
                onChange={(e) => setNameGeo(e.target.value)}
                placeholder="e.g. ინგლისური"
                onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#92400e" : "#f59e0b",
                color: "#0f1117",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#fbbf24")}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#f59e0b")}
            >
              {loading ? "Saving…" : "Save Language"}
            </button>

            {message && (
              <span style={{ fontSize: 13, color: "#86efac" }}>✓ {message}</span>
            )}
            {error && (
              <span style={{ fontSize: 13, color: "#fca5a5" }}>⚠ {error}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
