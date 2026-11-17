"use client";
import React, { useEffect, useState } from "react";
import { listUserPayments, type AdminUserPayment } from "@/features/adminPayments/services/adminPaymentsService";

const SIGN: Record<string, string> = { GEL: "₾", EUR: "€", USD: "$" };

export function money(amount: number, currency: string) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${SIGN[currency] ?? currency}`;
}

function when(value: string | null) {
  if (!value) return "–";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS: Record<string, { label: string; color: string; background: string }> = {
  succeeded: { label: "Paid", color: "#86efac", background: "rgba(34,197,94,0.12)" },
  failed: { label: "Failed", color: "#fca5a5", background: "rgba(239,68,68,0.12)" },
  refunded: { label: "Refunded", color: "#fcd34d", background: "rgba(245,158,11,0.12)" },
  created: { label: "Not finished", color: "#94a3b8", background: "rgba(148,163,184,0.1)" },
  pending: { label: "Pending", color: "#94a3b8", background: "rgba(148,163,184,0.1)" },
};

/**
 * One user's billing history: when, what and how much. Confirmed payments by
 * default; the switch adds failed and unfinished attempts, which is what to
 * look at when someone says a payment did not go through.
 */
export default function PaymentHistory({ userId, name }: { userId: string; name: string }) {
  const [all, setAll] = useState(false);
  const [payments, setPayments] = useState<AdminUserPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setPayments(null);
    setError(null);
    listUserPayments(userId, all)
      .then((rows) => {
        if (live) setPayments(rows);
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : "Failed to load payments");
      });
    return () => {
      live = false;
    };
  }, [userId, all]);

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 11,
    color: "#475569",
    padding: "4px 14px 6px 0",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = { padding: "7px 14px 7px 0", fontSize: 13, color: "#cbd5e1", whiteSpace: "nowrap" };
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 };

  return (
    <div style={{ borderLeft: "2px solid #f59e0b", marginLeft: 12, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Payments of {name}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Show failed and unfinished
        </label>
      </div>

      {error ? (
        <div style={{ color: "#fca5a5", fontSize: 13 }}>{error}</div>
      ) : payments === null ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Loading…</div>
      ) : payments.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13 }}>
          {all ? "No payment attempts." : "No confirmed payments."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                {["When", "What", "Amount", "Status", "Order", "Via"].map((h) => (
                  <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const status = STATUS[p.status] ?? {
                  label: p.status,
                  color: "#94a3b8",
                  background: "rgba(148,163,184,0.1)",
                };
                return (
                  <tr key={p.orderId} style={{ borderTop: "1px solid #1a1d2e" }}>
                    <td style={{ ...td, ...mono, color: "#94a3b8" }}>{when(p.createdAt)}</td>
                    <td style={td}>
                      {p.pages !== null ? `${p.pages.toLocaleString("en-US")} pages` : "–"}
                      {p.description && (
                        <span style={{ color: "#475569", fontSize: 12, marginLeft: 8 }}>{p.description}</span>
                      )}
                    </td>
                    <td style={{ ...td, ...mono, textAlign: "right", color: "#f8fafc" }}>
                      {money(p.amount, p.currency)}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: status.background,
                          color: status.color,
                          borderRadius: 4,
                          padding: "2px 7px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td
                      style={{ ...td, ...mono, fontSize: 11, color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}
                      title={p.orderId}
                    >
                      {p.orderId}
                    </td>
                    <td style={{ ...td, color: "#64748b", fontSize: 12 }}>{p.provider}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
