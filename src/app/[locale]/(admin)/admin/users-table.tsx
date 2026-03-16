"use client";
import React, { useMemo, useState } from "react";
import { updateUserProfile } from "@/features/auth/services/userService";

export type User = {
  id: string;
  userName: string;
  email?: string;
  phoneNUmber?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleName?: string;
  balance?: number;
  createdAt?: string;
  lastActivityAt?: string;
};

type SaveState = "idle" | "confirm" | "saving" | "saved";

const SortIcon = ({ dir }: { dir: "none" | "asc" | "desc" }) => (
  <span style={{ marginLeft: 4, opacity: dir === "none" ? 0.35 : 1, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
    {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "⇅"}
  </span>
);

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [rows, setRows] = useState<User[]>(initialUsers || []);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [balanceSort, setBalanceSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("none");
  const [lastActivitySort, setLastActivitySort] = useState<"none" | "asc" | "desc">("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const [showRoleId, setShowRoleId] = useState(false);

  const getSaveState = (id: string): SaveState => saveStates[id] ?? "idle";
  const setSaveState = (id: string, state: SaveState) =>
    setSaveStates((prev) => ({ ...prev, [id]: state }));

  const handleBalanceChange = (id: string, value: string) => {
    const numeric = value === "" ? undefined : Number(value);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, balance: Number.isFinite(numeric as number) ? (numeric as number) : (r.balance ?? 0) }
          : r
      )
    );
    // Reset save state when value changes
    setSaveState(id, "idle");
  };

  const handleSaveClick = async (row: User) => {
    const current = getSaveState(row.id);
    if (current === "idle") {
      setSaveState(row.id, "confirm");
      return;
    }
    if (current === "confirm") {
      setError(null);
      setSaveState(row.id, "saving");
      try {
        await updateUserProfile({
          id: row.id,
          userName: row.userName,
          email: row.email || "",
          phoneNUmber: row.phoneNUmber || row.phoneNumber || "",
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          roleId: row.roleId || "",
          balance: typeof row.balance === "number" ? row.balance : 0,
        });
        setSaveState(row.id, "saved");
        setTimeout(() => setSaveState(row.id, "idle"), 2000);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save user";
        setError(message);
        setSaveState(row.id, "idle");
      }
    }
  };

  const handleCancelSave = (id: string) => setSaveState(id, "idle");

  const toggleSort = (current: "none" | "asc" | "desc"): "none" | "asc" | "desc" =>
    current === "none" ? "asc" : current === "asc" ? "desc" : "none";

  const filteredRows = useMemo(() => {
    let filtered = rows;
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((u) => {
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
        const phone = (u.phoneNUmber || u.phoneNumber || "").toString().toLowerCase();
        const userName = (u.userName || "").toString().toLowerCase();
        const email = (u.email || "").toString().toLowerCase();
        return name.includes(q) || phone.includes(q) || userName.includes(q) || email.includes(q);
      });
    }
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter((u) => {
        if (!u.createdAt) return false;
        const userDate = new Date(u.createdAt);
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) toDate.setHours(23, 59, 59, 999);
        const userTime = userDate.getTime();
        return (
          userTime >= (fromDate ? fromDate.getTime() : -Infinity) &&
          userTime <= (toDate ? toDate.getTime() : Infinity)
        );
      });
    }
    return filtered;
  }, [rows, query, dateFilter]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (balanceSort !== "none") {
      copy.sort((a, b) => {
        const av = typeof a.balance === "number" ? a.balance : -Infinity;
        const bv = typeof b.balance === "number" ? b.balance : -Infinity;
        return balanceSort === "asc" ? av - bv : bv - av;
      });
    }
    if (dateSort !== "none") {
      copy.sort((a, b) => {
        const av = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
        const bv = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
        return dateSort === "asc" ? av - bv : bv - av;
      });
    }
    if (lastActivitySort !== "none") {
      copy.sort((a, b) => {
        const av = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : -Infinity;
        const bv = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : -Infinity;
        return lastActivitySort === "asc" ? av - bv : bv - av;
      });
    }
    return copy;
  }, [filteredRows, balanceSort, dateSort, lastActivitySort]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [query]);
  React.useEffect(() => { setCurrentPage(1); }, [itemsPerPage]);

  const exportToCSV = () => {
    const headers = ["ID","User Name","Email","Phone Number","First Name","Last Name","Role ID","Role Name","Balance","Created At","Last Activity"];
    const esc = (v: string | number | undefined) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvContent = [
      headers.map(esc).join(","),
      ...sortedRows.map((u) => [
        u.id, u.userName || "", u.email || "",
        u.phoneNUmber || u.phoneNumber || "",
        u.firstName || "", u.lastName || "",
        u.roleId || "", u.roleName || "",
        u.balance ?? 0,
        u.createdAt ? new Date(u.createdAt).toLocaleString() : "",
        u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleString() : "",
      ].map(esc).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const thStyle: React.CSSProperties = {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
    background: "#13151f",
  };

  const tdStyle: React.CSSProperties = {
    padding: "11px 14px",
    fontSize: 13,
    color: "#cbd5e1",
    borderTop: "1px solid #1e2130",
    whiteSpace: "nowrap",
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#94a3b8",
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
      {/* Toolbar */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #2a2d3a",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <svg
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
            width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            style={{
              width: "100%",
              background: "#0f1117",
              border: "1px solid #2a2d3a",
              borderRadius: 8,
              padding: "9px 12px 9px 32px",
              color: "#f8fafc",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            placeholder="Search name, phone, email, username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
          />
        </div>

        {/* Date filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.05em" }}>FROM</span>
          <input
            type="date"
            style={{
              background: "#0f1117",
              border: "1px solid #2a2d3a",
              borderRadius: 8,
              padding: "8px 10px",
              color: "#f8fafc",
              fontSize: 12,
              outline: "none",
              colorScheme: "dark",
            }}
            value={dateFilter.from || ""}
            onChange={(e) => setDateFilter((p) => ({ ...p, from: e.target.value }))}
          />
          <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.05em" }}>TO</span>
          <input
            type="date"
            style={{
              background: "#0f1117",
              border: "1px solid #2a2d3a",
              borderRadius: 8,
              padding: "8px 10px",
              color: "#f8fafc",
              fontSize: 12,
              outline: "none",
              colorScheme: "dark",
            }}
            value={dateFilter.to || ""}
            onChange={(e) => setDateFilter((p) => ({ ...p, to: e.target.value }))}
          />
          {(dateFilter.from || dateFilter.to) && (
            <button
              onClick={() => setDateFilter({})}
              style={{
                background: "transparent",
                border: "1px solid #2a2d3a",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={() => setShowRoleId((v) => !v)}
            style={{
              background: showRoleId ? "rgba(251,191,36,0.12)" : "transparent",
              border: `1px solid ${showRoleId ? "#fbbf24" : "#2a2d3a"}`,
              borderRadius: 8,
              padding: "7px 12px",
              color: showRoleId ? "#fbbf24" : "#64748b",
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Role IDs
          </button>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={{
              background: "#0f1117",
              border: "1px solid #2a2d3a",
              borderRadius: 8,
              padding: "7px 10px",
              color: "#94a3b8",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <button
            onClick={exportToCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 8,
              padding: "7px 14px",
              color: "#86efac",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Results count */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #1e2130",
          fontSize: 12,
          color: "#475569",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{sortedRows.length} results</span>
        <span>Page {currentPage} of {totalPages || 1}</span>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              {showRoleId && <th style={thStyle}>Role ID</th>}
              <th style={thStyle}>Role</th>
              <th style={{ ...thStyle, textAlign: "right", cursor: "pointer", userSelect: "none" }} onClick={() => setBalanceSort(toggleSort(balanceSort))}>
                Balance <SortIcon dir={balanceSort} />
              </th>
              <th style={{ ...thStyle, cursor: "pointer", userSelect: "none" }} onClick={() => setDateSort(toggleSort(dateSort))}>
                Created <SortIcon dir={dateSort} />
              </th>
              <th style={{ ...thStyle, cursor: "pointer", userSelect: "none" }} onClick={() => setLastActivitySort(toggleSort(lastActivitySort))}>
                Last Active <SortIcon dir={lastActivitySort} />
              </th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((u: User, i) => {
              const state = getSaveState(u.id);
              return (
                <tr
                  key={u.id}
                  style={{
                    animation: `fadeUp 0.3s ease ${Math.min(i * 30, 300)}ms both`,
                    transition: "background 0.12s",
                  }}
                  className="admin-table-row"
                >
                  <td style={tdStyle}>
                    <div style={{ ...monoStyle, fontSize: 13, color: "#e2e8f0" }}>{u.userName || "—"}</div>
                    <div style={{ ...monoStyle, fontSize: 10, color: "#475569", marginTop: 2 }}>{u.id}</div>
                  </td>
                  <td style={tdStyle}>
                    {u.firstName || u.lastName
                      ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                      : <span style={{ color: "#475569" }}>—</span>}
                  </td>
                  <td style={tdStyle}>{u.email || <span style={{ color: "#475569" }}>—</span>}</td>
                  <td style={tdStyle}>
                    <span style={monoStyle}>{u.phoneNUmber || u.phoneNumber || "—"}</span>
                  </td>
                  {showRoleId && (
                    <td style={tdStyle}>
                      <span style={{ ...monoStyle, fontSize: 11 }}>{u.roleId || "—"}</span>
                    </td>
                  )}
                  <td style={tdStyle}>
                    {u.roleName ? (
                      <span
                        style={{
                          background: "rgba(251,191,36,0.1)",
                          border: "1px solid rgba(251,191,36,0.2)",
                          borderRadius: 4,
                          padding: "2px 7px",
                          fontSize: 11,
                          color: "#fbbf24",
                          fontWeight: 500,
                        }}
                      >
                        {u.roleName}
                      </span>
                    ) : (
                      <span style={{ color: "#475569" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: 96,
                        background: "#0f1117",
                        border: "1px solid #2a2d3a",
                        borderRadius: 6,
                        padding: "5px 8px",
                        color: "#fbbf24",
                        fontSize: 13,
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: "none",
                      }}
                      value={typeof u.balance === "number" ? u.balance : 0}
                      onChange={(e) => handleBalanceChange(u.id, e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
                      onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
                    />
                  </td>
                  <td style={tdStyle}>
                    <span style={monoStyle}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={monoStyle}>
                      {u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                      {state === "confirm" && (
                        <button
                          onClick={() => handleCancelSave(u.id)}
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
                      )}
                      <button
                        disabled={state === "saving"}
                        onClick={() => handleSaveClick(u)}
                        style={{
                          background:
                            state === "saved"
                              ? "rgba(34,197,94,0.15)"
                              : state === "confirm"
                              ? "#f59e0b"
                              : "rgba(251,191,36,0.1)",
                          border: `1px solid ${
                            state === "saved"
                              ? "rgba(34,197,94,0.4)"
                              : state === "confirm"
                              ? "#f59e0b"
                              : "rgba(251,191,36,0.25)"
                          }`,
                          borderRadius: 6,
                          padding: "5px 12px",
                          color:
                            state === "saved"
                              ? "#86efac"
                              : state === "confirm"
                              ? "#0f1117"
                              : "#fbbf24",
                          fontSize: 12,
                          fontWeight: state === "confirm" ? 700 : 500,
                          cursor: state === "saving" ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                          opacity: state === "saving" ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : state === "confirm" ? "Confirm?" : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={showRoleId ? 10 : 9}
                  style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: 14 }}
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderTop: "1px solid #1e2130",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: "transparent",
                border: "1px solid #2a2d3a",
                borderRadius: 7,
                padding: "6px 12px",
                color: currentPage === 1 ? "#374151" : "#94a3b8",
                fontSize: 12,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    background: currentPage === pageNum ? "#f59e0b" : "transparent",
                    border: `1px solid ${currentPage === pageNum ? "#f59e0b" : "#2a2d3a"}`,
                    borderRadius: 7,
                    padding: "6px 11px",
                    color: currentPage === pageNum ? "#0f1117" : "#64748b",
                    fontSize: 12,
                    fontWeight: currentPage === pageNum ? 700 : 400,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                background: "transparent",
                border: "1px solid #2a2d3a",
                borderRadius: 7,
                padding: "6px 12px",
                color: currentPage === totalPages ? "#374151" : "#94a3b8",
                fontSize: 12,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, sortedRows.length)} of {sortedRows.length}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-table-row:hover td {
          background: rgba(251, 191, 36, 0.03);
        }
      `}</style>
    </div>
  );
}
