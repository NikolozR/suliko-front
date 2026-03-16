"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";

interface Language {
  id: number;
  name: string;
  nameGeo: string;
}

const panelStyle: React.CSSProperties = {
  background: "#13151f",
  border: "1px solid #2a2d3a",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
};

const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  background: "#0f1117",
  borderBottom: "1px solid #2a2d3a",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#cbd5e1",
  borderTop: "1px solid #1e2130",
};

export default function LanguageList() {
  const token = useAuthStore((s) => s.token);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    if (!token) { setError("Missing auth token. Please re-login."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/Language`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      let list: Language[] = [];
      if (Array.isArray(data)) list = data;
      else if (data?.items || data?.data) list = data.items ?? data.data ?? [];
      setLanguages(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch languages");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteLanguage = async (id: number) => {
    if (!token) { setError("Missing auth token."); return; }
    setDeletingId(id);
    setConfirmId(null);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/Language/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
      setLanguages((prev) => prev.filter((l) => l.id !== id));
      setSuccessMsg(`Language #${id} deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => { fetchLanguages(); }, [token, fetchLanguages]);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #2a2d3a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "#f8fafc",
          }}
        >
          System Languages
          {!loading && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 400,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              ({languages.length})
            </span>
          )}
        </span>
        <button
          onClick={fetchLanguages}
          style={{
            background: "transparent",
            border: "1px solid #2a2d3a",
            borderRadius: 7,
            padding: "6px 12px",
            color: "#64748b",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2d3a";
          }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div style={{ padding: "10px 16px", background: "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(34,197,94,0.15)", color: "#86efac", fontSize: 13 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button
            onClick={fetchLanguages}
            style={{ background: "rgba(239,68,68,0.2)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fca5a5", fontSize: 12, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#475569", fontSize: 14 }}>
          Loading languages…
        </div>
      ) : languages.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#475569", fontSize: 14 }}>
          No languages found
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 60 }}>ID</th>
              <th style={thStyle}>English Name</th>
              <th style={thStyle}>Georgian Name</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang) => (
              <tr key={lang.id} style={{ transition: "background 0.12s" }} className="admin-table-row">
                <td style={tdStyle}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#475569" }}>{lang.id}</span>
                </td>
                <td style={tdStyle}>{lang.name}</td>
                <td style={tdStyle}>{lang.nameGeo}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    {confirmId === lang.id ? (
                      <>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{
                            background: "transparent",
                            border: "1px solid #2a2d3a",
                            borderRadius: 6,
                            padding: "5px 10px",
                            color: "#64748b",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteLanguage(lang.id)}
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.4)",
                            borderRadius: 6,
                            padding: "5px 12px",
                            color: "#fca5a5",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Sure? Delete
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={deletingId === lang.id}
                        onClick={() => setConfirmId(lang.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: 6,
                          padding: "5px 12px",
                          color: "#f87171",
                          fontSize: 12,
                          cursor: deletingId === lang.id ? "not-allowed" : "pointer",
                          opacity: deletingId === lang.id ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== lang.id) {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.5)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.25)";
                        }}
                      >
                        {deletingId === lang.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style>{`
        .admin-table-row:hover td {
          background: rgba(251, 191, 36, 0.03);
        }
      `}</style>
    </div>
  );
}
