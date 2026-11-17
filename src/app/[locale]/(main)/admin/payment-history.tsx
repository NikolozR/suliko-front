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
  succeeded: { label: "Paid", color: "var(--status-success)", background: "color-mix(in srgb, var(--status-success) 12%, transparent)" },
  failed: { label: "Failed", color: "var(--destructive)", background: "color-mix(in srgb, var(--destructive) 12%, transparent)" },
  refunded: { label: "Refunded", color: "var(--status-warning)", background: "color-mix(in srgb, var(--status-warning) 12%, transparent)" },
  created: { label: "Not finished", color: "var(--muted-foreground)", background: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)" },
  pending: { label: "Pending", color: "var(--muted-foreground)", background: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)" },
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
    color: "var(--muted-foreground)",
    padding: "4px 14px 6px 0",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = { padding: "7px 14px 7px 0", fontSize: 13, color: "var(--foreground)", whiteSpace: "nowrap" };
  const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 12 };

  return (
    <div style={{ borderLeft: "2px solid var(--accent-text)", marginLeft: 12, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Payments of {name}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted-foreground)", cursor: "pointer" }}>
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Show failed and unfinished
        </label>
      </div>

      {error ? (
        <div style={{ color: "var(--destructive)", fontSize: 13 }}>{error}</div>
      ) : payments === null ? (
        <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading…</div>
      ) : payments.length === 0 ? (
        <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
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
                  color: "var(--muted-foreground)",
                  background: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
                };
                return (
                  <tr key={p.orderId} style={{ borderTop: "1px solid var(--muted)" }}>
                    <td style={{ ...td, ...mono, color: "var(--muted-foreground)" }}>{when(p.createdAt)}</td>
                    <td style={td}>
                      {p.pages !== null ? `${p.pages.toLocaleString("en-US")} pages` : "–"}
                      {p.description && (
                        <span style={{ color: "var(--muted-foreground)", fontSize: 12, marginLeft: 8 }}>{p.description}</span>
                      )}
                    </td>
                    <td style={{ ...td, ...mono, textAlign: "right", color: "var(--foreground)" }}>
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
                      style={{ ...td, ...mono, fontSize: 11, color: "var(--muted-foreground)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}
                      title={p.orderId}
                    >
                      {p.orderId}
                    </td>
                    <td style={{ ...td, color: "var(--muted-foreground)", fontSize: 12 }}>{p.provider}</td>
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
