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
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
};

const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  background: "var(--background)",
  borderBottom: "1px solid var(--border)",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "var(--foreground)",
  borderTop: "1px solid var(--muted)",
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
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--foreground)",
          }}
        >
          System Languages
          {!loading && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "ui-monospace, monospace",
                fontWeight: 400,
                fontSize: 12,
                color: "var(--muted-foreground)",
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
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "6px 12px",
            color: "var(--muted-foreground)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--accent-text) 40%, transparent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
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
        <div style={{ padding: "10px 16px", background: "color-mix(in srgb, var(--status-success) 8%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--status-success) 15%, transparent)", color: "var(--status-success)", fontSize: 13 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 16px", background: "color-mix(in srgb, var(--destructive) 8%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--destructive) 15%, transparent)", color: "var(--destructive)", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button
            onClick={fetchLanguages}
            style={{ background: "color-mix(in srgb, var(--destructive) 20%, transparent)", border: "none", borderRadius: 6, padding: "4px 10px", color: "var(--destructive)", fontSize: 12, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 14 }}>
          Loading languages…
        </div>
      ) : languages.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 14 }}>
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
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--muted-foreground)" }}>{lang.id}</span>
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
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: "5px 10px",
                            color: "var(--muted-foreground)",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteLanguage(lang.id)}
                          style={{
                            background: "color-mix(in srgb, var(--destructive) 15%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--destructive) 40%, transparent)",
                            borderRadius: 6,
                            padding: "5px 12px",
                            color: "var(--destructive)",
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
                          border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                          borderRadius: 6,
                          padding: "5px 12px",
                          color: "var(--destructive)",
                          fontSize: 12,
                          cursor: deletingId === lang.id ? "not-allowed" : "pointer",
                          opacity: deletingId === lang.id ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== lang.id) {
                            (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--destructive) 10%, transparent)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--destructive) 50%, transparent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--destructive) 25%, transparent)";
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
          background: color-mix(in srgb, var(--accent-text) 3%, transparent);
        }
      `}</style>
    </div>
  );
}
