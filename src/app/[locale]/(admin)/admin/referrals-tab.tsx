"use client";
import React, { useMemo, useState } from "react";
import { User } from "./users-table";

function fmt(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReferralsTab({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build lookup: referralCode → user
  const byCode = useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of users) {
      if (u.referralCode) map[u.referralCode] = u;
    }
    return map;
  }, [users]);

  // Only show users who have a referral code
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return users
      .filter((u) => u.referralCode)
      .filter((u) => {
        if (!q) return true;
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
        return (
          name.includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.referralCode ?? "").toLowerCase().includes(q) ||
          (u.userName ?? "").toLowerCase().includes(q)
        );
      });
  }, [users, query]);

  const getReferrer = (u: User) =>
    u.referredByCode ? byCode[u.referredByCode] : undefined;

  const getReferredUsers = (u: User) =>
    u.referralCode ? users.filter((x) => x.referredByCode === u.referralCode) : [];

  const displayName = (u: User) => {
    const n = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return n || u.userName || u.id;
  };

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, email or referral code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: "#1a1d2e",
            border: "1px solid #2a2d3a",
            borderRadius: 8,
            color: "#f8fafc",
            fontSize: 13,
            padding: "8px 14px",
            width: "100%",
            maxWidth: 360,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Users with codes", value: users.filter((u) => u.referralCode).length },
          { label: "Have referred someone", value: users.filter((u) => u.referralCode && users.some((x) => x.referredByCode === u.referralCode)).length },
          { label: "Were referred", value: users.filter((u) => u.referredByCode && byCode[u.referredByCode]).length },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#13151f",
              border: "1px solid #2a2d3a",
              borderLeft: "3px solid #f59e0b",
              borderRadius: 10,
              padding: "12px 18px",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 24, color: "#f8fafc" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2d3a" }}>
              {["User", "Their Code", "Referred By", "# Referred", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 11,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const referrer = getReferrer(u);
              const referredUsers = getReferredUsers(u);
              const isExpanded = expandedId === u.id;

              return (
                <React.Fragment key={u.id}>
                  <tr
                    style={{
                      borderBottom: "1px solid #1e2132",
                      transition: "background 0.12s",
                      background: isExpanded ? "rgba(251,191,36,0.04)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isExpanded ? "rgba(251,191,36,0.04)" : "transparent"; }}
                  >
                    {/* User */}
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ color: "#f8fafc", fontWeight: 500 }}>{displayName(u)}</div>
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{u.email}</div>
                    </td>

                    {/* Their code */}
                    <td style={{ padding: "10px 12px" }}>
                      <code
                        style={{
                          background: "rgba(251,191,36,0.1)",
                          color: "#fbbf24",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {u.referralCode}
                      </code>
                    </td>

                    {/* Referred by */}
                    <td style={{ padding: "10px 12px" }}>
                      {referrer ? (
                        <div>
                          <div style={{ color: "#94a3b8" }}>{displayName(referrer)}</div>
                          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{referrer.email}</div>
                        </div>
                      ) : u.referredByCode ? (
                        <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                          {u.referredByCode} <span style={{ color: "#334155" }}>(deleted?)</span>
                        </span>
                      ) : (
                        <span style={{ color: "#334155" }}>—</span>
                      )}
                    </td>

                    {/* # Referred */}
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          fontSize: 15,
                          color: referredUsers.length > 0 ? "#34d399" : "#334155",
                        }}
                      >
                        {referredUsers.length}
                      </span>
                    </td>

                    {/* Expand button */}
                    <td style={{ padding: "10px 12px" }}>
                      {referredUsers.length > 0 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #2a2d3a",
                            borderRadius: 6,
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: 12,
                            padding: "4px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isExpanded ? "▲ Hide" : "▼ View"}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded: list of referred users */}
                  {isExpanded && (
                    <tr style={{ background: "#0d0f1a" }}>
                      <td colSpan={5} style={{ padding: "0 0 0 40px" }}>
                        <div style={{ padding: "12px 12px 12px 0", borderLeft: "2px solid #f59e0b", marginLeft: 12, paddingLeft: 16 }}>
                          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                            Users referred by {displayName(u)}
                          </div>
                          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 600 }}>
                            <thead>
                              <tr>
                                {["Name", "Email", "Registered"].map((h) => (
                                  <th
                                    key={h}
                                    style={{
                                      textAlign: "left",
                                      fontSize: 11,
                                      color: "#475569",
                                      padding: "4px 12px 6px 0",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                    }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {referredUsers.map((ru) => (
                                <tr key={ru.id} style={{ borderTop: "1px solid #1a1d2e" }}>
                                  <td style={{ padding: "6px 12px 6px 0", color: "#cbd5e1", fontSize: 13 }}>{displayName(ru)}</td>
                                  <td style={{ padding: "6px 12px 6px 0", color: "#64748b", fontSize: 13 }}>{ru.email}</td>
                                  <td style={{ padding: "6px 12px 6px 0", color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(ru.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "32px 12px", color: "#475569", textAlign: "center", fontSize: 14 }}>
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
