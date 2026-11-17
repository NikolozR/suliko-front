"use client";
import React, { useMemo, useState } from "react";
import { User } from "./users-table";
import ReferralTree, { buildReferralForest, displayName, fmt, matchesQuery } from "./referral-tree";

type View = "tree" | "list";

export default function ReferralsTab({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("tree");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const forest = useMemo(() => buildReferralForest(users), [users]);

  // Build lookup: referralCode → user
  const byCode = useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of users) {
      if (u.referralCode) map[u.referralCode] = u;
    }
    return map;
  }, [users]);

  // Only show users who have a referral code
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () => users.filter((u) => u.referralCode).filter((u) => matchesQuery(u, q)),
    [users, q],
  );

  const getReferrer = (u: User) =>
    u.referredByCode ? byCode[u.referredByCode] : undefined;

  const getReferredUsers = (u: User) =>
    u.referralCode ? users.filter((x) => x.referredByCode === u.referralCode) : [];

  return (
    <div>
      {/* Search and view */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, email or referral code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 13,
            padding: "8px 14px",
            width: "100%",
            maxWidth: 360,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <div role="group" aria-label="View" style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {(["tree", "list"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? "color-mix(in srgb, var(--accent-text) 12%, transparent)" : "transparent",
                border: "none",
                color: view === v ? "var(--accent-text)" : "var(--muted-foreground)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: view === v ? 600 : 500,
                padding: "7px 14px",
                fontFamily: "inherit",
              }}
            >
              {v === "tree" ? "Tree" : "List"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Users with codes", value: users.filter((u) => u.referralCode).length },
          { label: "Have referred someone", value: users.filter((u) => u.referralCode && users.some((x) => x.referredByCode === u.referralCode)).length },
          { label: "Were referred", value: users.filter((u) => u.referredByCode && byCode[u.referredByCode]).length },
          { label: "Longest chain", value: forest.longestChain },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--accent-text)",
              borderRadius: 10,
              padding: "12px 18px",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 500, fontSize: 24, color: "var(--foreground)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {view === "tree" && <ReferralTree roots={forest.roots} query={q} />}

      {/* Table */}
      {view === "list" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User", "Their Code", "Referred By", "# Referred", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "var(--muted-foreground)",
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
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.12s",
                        background: isExpanded ? "color-mix(in srgb, var(--accent-text) 4%, transparent)" : "transparent",
                      }}
                      onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isExpanded ? "color-mix(in srgb, var(--accent-text) 4%, transparent)" : "transparent"; }}
                    >
                      {/* User */}
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ color: "var(--foreground)", fontWeight: 500 }}>{displayName(u)}</div>
                        <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 2 }}>{u.email}</div>
                      </td>

                      {/* Their code */}
                      <td style={{ padding: "10px 12px" }}>
                        <code
                          style={{
                            background: "color-mix(in srgb, var(--accent-text) 10%, transparent)",
                            color: "var(--accent-text)",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontFamily: "ui-monospace, monospace",
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
                            <div style={{ color: "var(--muted-foreground)" }}>{displayName(referrer)}</div>
                            <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 2 }}>{referrer.email}</div>
                          </div>
                        ) : u.referredByCode ? (
                          <span style={{ color: "var(--muted-foreground)", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                            {u.referredByCode} <span style={{ color: "var(--border)" }}>(deleted?)</span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--border)" }}>–</span>
                        )}
                      </td>

                      {/* # Referred */}
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontWeight: 600,
                            fontSize: 15,
                            color: referredUsers.length > 0 ? "var(--status-success)" : "var(--border)",
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
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              color: "var(--muted-foreground)",
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
                      <tr style={{ background: "var(--background)" }}>
                        <td colSpan={5} style={{ padding: "0 0 0 40px" }}>
                          <div style={{ padding: "12px 12px 12px 0", borderLeft: "2px solid var(--accent-text)", marginLeft: 12, paddingLeft: 16 }}>
                            <div style={{ fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
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
                                        color: "var(--muted-foreground)",
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
                                  <tr key={ru.id} style={{ borderTop: "1px solid var(--muted)" }}>
                                    <td style={{ padding: "6px 12px 6px 0", color: "var(--foreground)", fontSize: 13 }}>{displayName(ru)}</td>
                                    <td style={{ padding: "6px 12px 6px 0", color: "var(--muted-foreground)", fontSize: 13 }}>{ru.email}</td>
                                    <td style={{ padding: "6px 12px 6px 0", color: "var(--muted-foreground)", fontSize: 12, fontFamily: "ui-monospace, monospace" }}>{fmt(ru.createdAt)}</td>
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
                  <td colSpan={5} style={{ padding: "32px 12px", color: "var(--muted-foreground)", textAlign: "center", fontSize: 14 }}>
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
